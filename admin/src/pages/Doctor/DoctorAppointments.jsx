import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    cancelAppointment,
    completeAppointment,
    confirmAppointment, // Import new function from context
    addPrescription, // Import new function from context
  } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge } = useContext(AppContext);

  const [prescriptionModal, setPrescriptionModal] = useState({
    show: false,
    appointmentId: null,
    text: "",
  });

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken, getAppointments]);

  const handleAddPrescriptionClick = (appointment) => {
    setPrescriptionModal({
      show: true,
      appointmentId: appointment._id,
      text: appointment.prescription || "", // Pre-fill if exists
    });
  };

  const handleSavePrescription = async () => {
    if (!prescriptionModal.text.trim()) {
      toast.error("Prescription cannot be empty.");
      return;
    }
    await addPrescription(
      prescriptionModal.appointmentId,
      prescriptionModal.text
    );
    setPrescriptionModal({ show: false, appointmentId: null, text: "" });
  };

  const handleCancelPrescription = () => {
    setPrescriptionModal({ show: false, appointmentId: null, text: "" });
  };

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      {/* Prescription Modal */}
      {prescriptionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-1/3 min-w-[300px]">
            <h2 className="text-xl font-semibold mb-4">
              Add/Edit Prescription
            </h2>
            <textarea
              className="w-full p-2 border rounded resize-y focus:outline-primary"
              rows="6"
              value={prescriptionModal.text}
              onChange={(e) =>
                setPrescriptionModal((prev) => ({
                  ...prev,
                  text: e.target.value,
                }))
              }
              placeholder="Write prescription here..."
            ></textarea>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleCancelPrescription}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrescription}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        {/* Adjusted grid for new columns */}
        <div className="max-sm:hidden grid grid-cols-[0.5fr_1.5fr_2fr_1.5fr_1fr_2fr] gap-2 py-3 px-6 border-b font-semibold">
          <p>#</p>
          <p>Patient</p>
          <p>Symptoms (Raw & NLP)</p> {/* Updated column header */}
          <p>Date & Time</p>
          <p>Status</p>
          <p>Actions</p>
        </div>
        {appointments.length === 0 ? (
          <div className="p-5 text-center text-gray-500">
            No appointments found.
          </div>
        ) : (
          appointments.map((item, index) => (
            <div
              className="grid grid-cols-[0.5fr_1.5fr_2fr_1.5fr_1fr_2fr] gap-2 items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50"
              key={index}
            >
              <p>{index + 1}</p>
              <div className="flex items-center gap-2">
                <img
                  src={item.userData.image}
                  className="w-8 h-8 rounded-full"
                  alt=""
                />
                <div>
                  <p className="font-medium">{item.userData.name}</p>
                  <p className="text-xs">
                    {calculateAge(item.userData.dob)} years old
                  </p>
                  {item.isCrucial && (
                    <span className="text-xs text-red-500 font-bold">
                      Crucial Patient
                    </span>
                  )}
                </div>
              </div>
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
              <p>
                {slotDateFormat(item.slotDate)}, {item.slotTime}
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

              {/* Actions */}
              <div className="flex flex-col gap-1.5">
                {item.status === "Booked" && (
                  <button
                    onClick={() => confirmAppointment(item._id)}
                    className="text-xs bg-green-500 text-white py-1.5 px-2 rounded hover:bg-green-600 transition"
                  >
                    Confirm
                  </button>
                )}
                {item.status === "Confirmed" && (
                  <>
                    <button
                      onClick={() => completeAppointment(item._id)}
                      className="text-xs bg-blue-500 text-white py-1.5 px-2 rounded hover:bg-blue-600 transition"
                    >
                      Mark as Complete
                    </button>
                    <button
                      onClick={() => handleAddPrescriptionClick(item)}
                      className="text-xs bg-purple-500 text-white py-1.5 px-2 rounded hover:bg-purple-600 transition"
                    >
                      {item.prescription ? "Edit Rx" : "Add Rx"}
                    </button>
                  </>
                )}
                {(item.status === "Booked" || item.status === "Confirmed") && (
                  <button
                    onClick={() => cancelAppointment(item._id)}
                    className="text-xs bg-red-500 text-white py-1.5 px-2 rounded hover:bg-red-600 transition"
                  >
                    Cancel
                  </button>
                )}
                {item.status === "Completed" && item.prescription && (
                  <button
                    onClick={() => handleAddPrescriptionClick(item)}
                    className="text-xs bg-gray-500 text-white py-1.5 px-2 rounded hover:bg-gray-600 transition"
                  >
                    View Rx
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
