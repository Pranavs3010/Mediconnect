import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import axios from "axios";
import { toast } from "react-toastify";

const Appointment = () => {
  const { docId } = useParams();
  const {
    doctors,
    currencySymbol,
    backendUrl,
    token,
    getDoctosData,
    userData,
  } = useContext(AppContext);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const [docInfo, setDocInfo] = useState(false);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  // New states for symptoms and crucial toggle
  const [symptoms, setSymptoms] = useState("");
  const [isCrucial, setIsCrucial] = useState(false);

  const navigate = useNavigate();

  const fetchDocInfo = async () => {
    const docInfoData = doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfoData);
  };

  const getAvailableSlots = async () => {
    if (!docInfo) return;

    setDocSlots([]);
    let today = new Date();

    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      let endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (today.getDate() === currentDate.getDate()) {
        let currentHour = new Date().getHours();
        currentDate.setHours(currentHour > 10 ? currentHour + 1 : 10);
        currentDate.setMinutes(new Date().getMinutes() > 30 ? 0 : 30);
        if (new Date().getMinutes() > 30)
          currentDate.setHours(currentDate.getHours() + 1);
      } else {
        currentDate.setHours(10, 0, 0, 0);
      }

      let timeSlots = [];
      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const slotDate = `${currentDate.getDate()}_${
          currentDate.getMonth() + 1
        }_${currentDate.getFullYear()}`;

        const isSlotBooked =
          docInfo.slots_booked[slotDate] &&
          docInfo.slots_booked[slotDate].includes(formattedTime);

        if (!isSlotBooked) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime,
          });
        }
        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }
      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warning("Please log in to book an appointment.");
      return navigate("/login");
    }
    // Added userData check for crucial contact info
    if (
      !userData ||
      !userData.phone ||
      userData.phone === "000000000" ||
      !userData.address.line1
    ) {
      toast.error(
        'Please complete your profile (phone and address) in "My Profile" before booking.'
      );
      return navigate("/my-profile");
    }
    if (!slotTime) {
      return toast.error("Please select a time slot.");
    }
    if (!symptoms.trim()) {
      return toast.error("Please describe your symptoms.");
    }

    const date = docSlots[slotIndex][0].datetime;
    const slotDate = `${date.getDate()}_${
      date.getMonth() + 1
    }_${date.getFullYear()}`;

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        { docId, slotDate, slotTime, symptoms, isCrucial },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        await getDoctosData();
        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  useEffect(() => {
    if (doctors.length > 0) {
      fetchDocInfo();
    }
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
  }, [docInfo]);

  return docInfo ? (
    <div>
      {/* ---------- Doctor Details ----------- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <img
            className="bg-primary/80 w-full sm:max-w-72 rounded-lg"
            src={docInfo.image}
            alt=""
          />
        </div>
        <div className="flex-1 border border-stone-200 rounded-lg p-8 py-7 bg-white">
          <p className="flex items-center gap-2 text-3xl font-medium text-gray-700">
            {docInfo.name}{" "}
            <img className="w-5" src={assets.verified_icon} alt="" />
          </p>
          <div className="flex items-center gap-2 mt-1 text-gray-600">
            <p>
              {docInfo.degree} - {docInfo.speciality}
            </p>
            <button className="py-0.5 px-2 border text-xs rounded-full">
              {docInfo.experience}
            </button>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-[#262626] mt-3">
              About <img className="w-3" src={assets.info_icon} alt="" />
            </p>
            <p className="text-sm text-gray-600 max-w-[700px] mt-1">
              {docInfo.about}
            </p>
          </div>
          <p className="text-gray-600 font-medium mt-4">
            Appointment fee:{" "}
            <span className="text-gray-800">
              {currencySymbol}
              {docInfo.fees}
            </span>
          </p>
        </div>
      </div>

      {/* Booking slots */}
      <div className="sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]">
        <p>Booking slots</p>
        <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4 pb-2">
          {docSlots.length > 0 &&
            docSlots.map(
              (item, index) =>
                item.length > 0 && (
                  <div
                    onClick={() => {
                      setSlotIndex(index);
                      setSlotTime("");
                    }}
                    key={index}
                    className={`text-center py-6 min-w-16 rounded-full cursor-pointer transition-all ${
                      slotIndex === index
                        ? "bg-primary text-white shadow-lg"
                        : "border border-[#DDDDDD] bg-white"
                    }`}
                  >
                    <p>{daysOfWeek[item[0].datetime.getDay()]}</p>
                    <p>{item[0].datetime.getDate()}</p>
                  </div>
                )
            )}
        </div>

        <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4 pb-2">
          {docSlots.length > 0 &&
            docSlots[slotIndex] &&
            docSlots[slotIndex].map((item, index) => (
              <p
                onClick={() => setSlotTime(item.time)}
                key={index}
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer transition-all ${
                  item.time === slotTime
                    ? "bg-primary text-white shadow-lg"
                    : "text-[#949494] border border-[#B4B4B4] bg-white"
                }`}
              >
                {item.time.toLowerCase()}
              </p>
            ))}
          {docSlots.length > 0 &&
            docSlots[slotIndex] &&
            docSlots[slotIndex].length === 0 && (
              <p className="text-sm text-gray-500">
                No slots available for this day.
              </p>
            )}
        </div>

        {/* New Symptoms Textarea */}
        <div className="mt-6">
          <p>Describe your Symptoms</p>
          <textarea
            className="w-full max-w-lg p-3 mt-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition"
            rows="4"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder='e.g., "I have been experiencing a persistent cough and fever for the last 3 days."'
            required
          ></textarea>
        </div>

        <button
          onClick={bookAppointment}
          className="bg-primary text-white text-sm font-light px-20 py-3 rounded-full my-8 hover:bg-primary/90 transition-all shadow-lg"
        >
          Book an appointment
        </button>
      </div>

      <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
    </div>
  ) : (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-20 h-20 border-4 border-gray-300 border-t-4 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};

export default Appointment;
