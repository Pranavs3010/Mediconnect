import React, { useEffect } from "react";
import { assets } from "../../assets/assets";
import { useContext } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";

const AllAppointments = () => {
  const { aToken, appointments, cancelAppointment, getAllAppointments } =
    useContext(AdminContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken, getAllAppointments]);

  return (
    <div className="w-full max-w-6xl m-5 ">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        {/* Adjusted grid for new columns */}
        <div className="hidden sm:grid grid-cols-[0.5fr_1.5fr_1fr_1.5fr_1.5fr_1fr_1fr_2fr] grid-flow-col py-3 px-6 border-b font-semibold">
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Status</p> {/* Updated column header */}
          <p>Symptoms (Raw & NLP)</p> {/* New column header */}
        </div>
        {appointments.length === 0 ? (
          <div className="p-5 text-center text-gray-500">
            No appointments found.
          </div>
        ) : (
          appointments.map((item, index) => (
            <div
              className="flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_1.5fr_1fr_1.5fr_1.5fr_1fr_1fr_2fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
              key={index}
            >
              <p className="max-sm:hidden">{index + 1}</p>
              <div className="flex items-center gap-2">
                <img
                  src={item.userData.image}
                  className="w-8 rounded-full"
                  alt=""
                />{" "}
                <p>{item.userData.name}</p>
              </div>
              <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>
              <p>
                {slotDateFormat(item.slotDate)}, {item.slotTime}
              </p>
              <div className="flex items-center gap-2">
                <img
                  src={item.docData.image}
                  className="w-8 rounded-full bg-gray-200"
                  alt=""
                />{" "}
                <p>{item.docData.name}</p>
              </div>
              <p>
                {currency}
                {item.amount}
              </p>
              {/* Status Display */}
              <p
                className={`text-xs font-medium py-1 px-2 rounded-full text-center capitalize ${
                  item.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : item.status === "Confirmed"
                    ? "bg-blue-100 text-blue-700"
                    : item.status === "Cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {item.status}
              </p>
              {/* --- Display Symptoms and Processed Symptoms --- */}
              <div className="text-xs">
                <p className="font-medium">Raw:</p>
                <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.symptoms}
                </p>
                {item.processedSymptoms &&
                  Object.keys(item.processedSymptoms).length > 0 && (
                    <div className="mt-1 text-gray-500">
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
              {/* --- END Display Symptoms --- */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllAppointments;
