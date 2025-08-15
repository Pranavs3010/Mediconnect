import express from "express";
import {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,
  changeAvailablity,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  confirmAppointment,
  addPrescription,
} from "../controllers/doctorController.js";
import authDoctor from "../middleware/authDoctor.js";
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor); // Note: Your frontend uses GET, but docId is in req.body via middleware, which is less common for GET. It works but POST is often preferred for sending body data.
doctorRouter.get("/list", doctorList);
doctorRouter.post("/change-availability", authDoctor, changeAvailablity);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard); // Note: Similar to appointmentsDoctor, docId from middleware for GET.
doctorRouter.get("/profile", authDoctor, doctorProfile); // Note: Similar to appointmentsDoctor, docId from middleware for GET.
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);
// --- NEW ROUTES ---
doctorRouter.post("/confirm-appointment", authDoctor, confirmAppointment);
doctorRouter.post("/add-prescription", authDoctor, addPrescription);
// --- END NEW ROUTES ---

export default doctorRouter;
