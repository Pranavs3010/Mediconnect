import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from "cloudinary";
import stripe from "stripe";
import razorpay from "razorpay";

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- NLP Placeholder Function (UPDATED for more detail) ---
const processSymptomsWithNLP = (symptomText) => {
  const lowerCaseText = symptomText.toLowerCase();
  const extracted = {
    keywords: [],
    identifiedSymptoms: [],
    duration: [],
    bodyParts: [],
    sentiment: "neutral",
    severity: "mild",
  };

  const commonSymptoms = {
    headache: "Headache",
    fever: "Fever",
    cough: "Cough",
    "sore throat": "Sore Throat",
    nausea: "Nausea",
    fatigue: "Fatigue",
    pain: "Pain",
    dizziness: "Dizziness",
    "chest pain": "Chest Pain",
    "shortness of breath": "Shortness of Breath",
    vomiting: "Vomiting",
    diarrhea: "Diarrhea",
    rash: "Rash",
    itchy: "Itchiness",
    bleeding: "Bleeding",
  };
  for (const keyword in commonSymptoms) {
    if (lowerCaseText.includes(keyword)) {
      extracted.identifiedSymptoms.push(commonSymptoms[keyword]);
    }
  }
  extracted.identifiedSymptoms = Array.from(
    new Set(extracted.identifiedSymptoms)
  );

  const durationMatches = lowerCaseText.match(
    /(\d+\s*(day|days|week|weeks|month|months|year|years))/g
  );
  if (durationMatches)
    extracted.duration = Array.from(new Set(durationMatches));

  const bodyPartsMap = {
    head: "Head",
    chest: "Chest",
    stomach: "Stomach/Abdomen",
    abdomen: "Stomach/Abdomen",
    throat: "Throat",
    limb: "Limb",
    arm: "Arm",
    leg: "Leg",
    back: "Back",
    eye: "Eye",
    ear: "Ear",
    nose: "Nose",
  };
  for (const bpKeyword in bodyPartsMap) {
    if (lowerCaseText.includes(bpKeyword)) {
      extracted.bodyParts.push(bodyPartsMap[bpKeyword]);
    }
  }
  extracted.bodyParts = Array.from(new Set(extracted.bodyParts));

  if (
    lowerCaseText.includes("severe") ||
    lowerCaseText.includes("terrible") ||
    lowerCaseText.includes("excruciating")
  ) {
    extracted.severity = "severe";
    extracted.sentiment = "negative";
  } else if (
    lowerCaseText.includes("moderate") ||
    lowerCaseText.includes("intense")
  ) {
    extracted.severity = "moderate";
    extracted.sentiment = "negative";
  } else if (
    lowerCaseText.includes("mild") ||
    lowerCaseText.includes("slight") ||
    lowerCaseText.includes("little")
  ) {
    extracted.severity = "mild";
    extracted.sentiment = "mild negative";
  }

  if (
    lowerCaseText.includes("better") ||
    lowerCaseText.includes("improving") ||
    lowerCaseText.includes("recovering")
  ) {
    extracted.sentiment = "positive";
  } else if (
    extracted.sentiment === "neutral" &&
    (lowerCaseText.includes("worse") || lowerCaseText.includes("deteriorating"))
  ) {
    extracted.sentiment = "negative";
  }

  const words = lowerCaseText.split(/\s+/).filter((word) => word.length > 2);
  const excludedWords = new Set([
    ...Object.keys(commonSymptoms),
    ...Object.keys(bodyPartsMap),
    "i",
    "have",
    "a",
    "for",
    "and",
    "feel",
    "my",
    "the",
    "is",
    "it",
    "was",
    "am",
    "are",
    "not",
    "very",
    "been",
    "experiencing",
    "persistent",
    "last",
    "with",
    "of",
    "in",
    "an",
    "at",
    "on",
    "from",
    "to",
    "as",
    // Add more stop words or domain-specific words if needed
  ]);

  extracted.keywords = Array.from(
    new Set(
      words.filter(
        (word) =>
          !excludedWords.has(word) &&
          !extracted.identifiedSymptoms
            .map((s) => s.toLowerCase())
            .includes(word) &&
          !extracted.duration
            .map((d) => d.toLowerCase())
            .some((dWord) => word.includes(dWord)) &&
          !extracted.bodyParts.map((bp) => bp.toLowerCase()).includes(word)
      )
    )
  ).slice(0, 5);

  return extracted;
};
// --- END NLP Placeholder Function ---

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to book appointment (UPDATED)
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime, symptoms, isCrucial } = req.body;

    if (!symptoms || symptoms.trim() === "") {
      return res.json({ success: false, message: "Symptoms are required." });
    }

    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor Not Available" });
    }

    let slots_booked = docData.slots_booked;
    if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
      return res.json({ success: false, message: "Slot Not Available" });
    } else {
      slots_booked[slotDate] = slots_booked[slotDate]
        ? [...slots_booked[slotDate], slotTime]
        : [slotTime];
    }

    const userData = await userModel.findById(userId).select("-password");
    delete docData.slots_booked;

    // --- NEW: Process symptoms with NLP ---
    const processedSymptoms = processSymptomsWithNLP(symptoms);
    // --- END NEW ---

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      symptoms,
      processedSymptoms, // Save NLP processed data
      isCrucial,
      status: "Booked", // Initial status set to 'Booked'
      date: Date.now(),
      payment: false,
      cancelled: false, // Keeping these for compatibility but status is primary
      isCompleted: false, // Keeping these for compatibility but status is primary
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({
      success: true,
      message: "Appointment Booked Successfully. Awaiting doctor confirmation.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment (User side - UPDATED to use 'status')
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.userId !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized action or Appointment not found",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      status: "Cancelled",
      cancelled: true, // Keep for legacy if needed
    });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    if (slots_booked[slotDate]) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(
        (e) => e !== slotTime
      );
    }
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.status === "Cancelled") {
      // Use status
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }

    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {
        payment: true,
      });
      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { origin } = req.headers;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData || appointmentData.status === "Cancelled") {
      // Use status
      return res.json({
        success: false,
        message: "Appointment Cancelled or not found",
      });
    }

    const currency = process.env.CURRENCY.toLocaleLowerCase();

    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: "Appointment Fees",
          },
          unit_amount: appointmentData.amount * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
      cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
      line_items: line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyStripe = async (req, res) => {
  try {
    const { appointmentId, success } = req.body;

    if (success === "true") {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        payment: true,
      });
      return res.json({ success: true, message: "Payment Successful" });
    }

    res.json({ success: false, message: "Payment Failed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  paymentStripe,
  verifyStripe,
};
