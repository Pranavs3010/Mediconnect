import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

const MyAppointments = () => {
  const { backendUrl, token, currencySymbol } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split("_");
    // Ensure month is 0-indexed for array access
    return `${dateArray[0]} ${months[Number(dateArray[1]) - 1]} ${
      dateArray[2]
    }`;
  };

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });
      if (data.success) {
        setAppointments(data.appointments.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        await getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  // Centralized payment handling
  const handlePayment = async (appointmentId, paymentMethod) => {
    try {
      let responseData;
      if (paymentMethod === "stripe") {
        const { data } = await axios.post(
          `${backendUrl}/api/user/payment-stripe`,
          { appointmentId },
          { headers: { token } }
        );
        responseData = data;
        if (responseData.success) {
          window.location.replace(responseData.session_url);
        }
      } else if (paymentMethod === "razorpay") {
        const { data } = await axios.post(
          `${backendUrl}/api/user/payment-razorpay`,
          { appointmentId },
          { headers: { token } }
        );
        responseData = data;
        if (responseData.success) {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Your Razorpay Key
            amount: responseData.order.amount,
            currency: responseData.order.currency,
            name: "Prescripto Appointment Payment",
            description: "Appointment Payment",
            order_id: responseData.order.id,
            handler: async (response) => {
              try {
                const { data: verifyData } = await axios.post(
                  `${backendUrl}/api/user/verifyRazorpay`,
                  response,
                  { headers: { token } }
                );
                if (verifyData.success) {
                  toast.success(verifyData.message);
                  getUserAppointments(); // Refresh appointments after successful payment
                } else {
                  toast.error(verifyData.message);
                }
              } catch (error) {
                console.error("Razorpay verification error:", error);
                toast.error("Payment verification failed.");
              }
            },
            prefill: {
              name: item.userData.name, // Assuming item is accessible here from map scope
              email: item.userData.email,
              contact: item.userData.phone, // Assuming phone exists in userData
            },
            notes: {
              appointment_id: appointmentId,
            },
            theme: {
              color: "#4A90E2", // Your primary color
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }

      if (!responseData.success) {
        toast.error(responseData.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <div className="my-12">
      <p className="pb-3 text-2xl font-semibold text-gray-700 border-b">
        My Appointments
      </p>
      <div className="mt-5 flex flex-col gap-6">
        {appointments.length > 0 ? (
          appointments.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4 p-4 border rounded-lg shadow-sm bg-white"
            >
              {/* Left Side: Doctor Info & Actions */}
              <div className="flex flex-col items-center md:items-start">
                <img
                  className="w-36 h-36 object-cover rounded-lg bg-[#EAEFFF]"
                  src={item.docData.image}
                  alt={item.docData.name}
                />
                <div className="w-full mt-4 flex flex-col gap-2 text-sm text-center">
                  {/* Status Badge */}
                  <p
                    className={`font-semibold py-1.5 px-3 rounded-full text-center capitalize ${
                      item.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : item.status === "Cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.status}
                  </p>

                  {/* Payment Buttons */}
                  {item.status === "Confirmed" && !item.payment && (
                    <>
                      <button
                        onClick={() => handlePayment(item._id, "stripe")}
                        className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <img
                          className="max-h-5"
                          src={assets.stripe_logo}
                          alt="Stripe"
                        />{" "}
                        Pay {currencySymbol}
                        {item.amount}
                      </button>
                      <button
                        onClick={() => handlePayment(item._id, "razorpay")}
                        className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <img
                          className="max-h-5"
                          src={assets.razorpay_logo}
                          alt="Razorpay"
                        />{" "}
                        Pay {currencySymbol}
                        {item.amount}
                      </button>
                    </>
                  )}
                  {item.status === "Confirmed" && item.payment && (
                    <p className="w-full py-2 border border-green-500 bg-green-50 text-green-700 rounded-lg">
                      Paid
                    </p>
                  )}

                  {/* Cancel Button */}
                  {(item.status === "Booked" ||
                    item.status === "Confirmed") && (
                    <button
                      onClick={() => cancelAppointment(item._id)}
                      className="w-full py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side: Appointment Details */}
              <div className="text-sm text-[#5E5E5E]">
                <p className="text-xl font-bold text-gray-800">
                  {item.docData.name}
                </p>
                <p className="text-gray-600">{item.docData.speciality}</p>
                <p className="mt-2">
                  <span className="font-medium text-gray-700">
                    Date & Time:
                  </span>{" "}
                  {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>
                <p className="">
                  <span className="font-medium text-gray-700">Address:</span>{" "}
                  {item.docData.address.line1}, {item.docData.address.line2}
                </p>
                {item.isCrucial && (
                  <p className="text-red-600 font-semibold mt-1">
                    This is marked as a crucial appointment.
                  </p>
                )}

                <hr className="my-3" />

                {/* Symptoms */}
                <div className="mt-2">
                  <p className="font-semibold text-gray-700">
                    Symptoms Provided:
                  </p>
                  <p className="text-gray-600 mt-1 italic p-3 bg-gray-50 rounded-lg">
                    "{item.symptoms}"
                  </p>
                  {item.processedSymptoms &&
                    Object.keys(item.processedSymptoms).length > 0 && (
                      <div className="mt-1 text-xs text-gray-700">
                        {item.processedSymptoms.identifiedSymptoms &&
                          item.processedSymptoms.identifiedSymptoms.length >
                            0 && (
                            <p>
                              Identified:{" "}
                              {item.processedSymptoms.identifiedSymptoms.join(
                                ", "
                              )}
                            </p>
                          )}
                        {item.processedSymptoms.duration &&
                          item.processedSymptoms.duration.length > 0 && (
                            <p>
                              Duration:{" "}
                              {item.processedSymptoms.duration.join(", ")}
                            </p>
                          )}
                        {item.processedSymptoms.sentiment && (
                          <p>Sentiment: {item.processedSymptoms.sentiment}</p>
                        )}
                        {item.processedSymptoms.severity && (
                          <p>Severity: {item.processedSymptoms.severity}</p>
                        )}
                      </div>
                    )}
                </div>

                {/* Prescription */}
                {item.prescription && (
                  <div className="mt-3">
                    <p className="font-semibold text-gray-700">
                      Doctor's Prescription:
                    </p>
                    <p className="text-gray-800 whitespace-pre-wrap mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      {item.prescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p>You have no appointments scheduled.</p>
            <button
              onClick={() => navigate("/doctors")}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-full"
            >
              Book an Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
