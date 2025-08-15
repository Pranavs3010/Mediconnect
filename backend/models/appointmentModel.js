import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, required: true },
  symptoms: { type: String, required: true }, // Existing New Field
  // --- ADDED: Field for NLP processed data ---
  processedSymptoms: { type: Object, default: {} },
  // --- END ADDED ---
  prescription: { type: String, default: "" }, // Existing New Field
  isCrucial: { type: Boolean, default: false }, // Existing New Field
  status: { type: String, default: "Booked" }, // Existing New Field: Booked, Confirmed, Completed, Cancelled
  date: { type: Number, required: true },
  payment: { type: Boolean, default: false },
  // The 'cancelled' and 'isCompleted' fields are now largely replaced by the 'status' field.
  // Keeping them for backward compatibility as per your provided model.
  cancelled: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
});

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);
export default appointmentModel;
