import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import cron from "node-cron";
import appointmentModel from "./models/appointmentModel.js";
import { sendEmail, sendSms } from "./services/notificationService.js"; // ✅ Import only

// App config
const app = express();
const port = process.env.PORT || 4001;
connectDB();
connectCloudinary();

// Middlewares
app.use(express.json());

// CORS setup
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// API endpoints
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Daily Reminder Scheduler
cron.schedule(
  "0 8 * * *", // Runs every day at 8:00 AM
  async () => {
    console.log("Running daily reminder check...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderDates = (days) => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;
    };

    try {
      const appointments = await appointmentModel.find({
        status: "Confirmed",
        slotDate: {
          $in: [
            reminderDates(0),
            reminderDates(1),
            reminderDates(3),
            reminderDates(7),
          ],
        },
      });

      for (const appt of appointments) {
        const patientEmail = appt.userData?.email;
        const patientPhone = appt.userData?.phone;
        let reminderMsg = "";

        const slotDateToday = reminderDates(0);
        const slotDate1Day = reminderDates(1);
        const slotDate3Days = reminderDates(3);
        const slotDate7Days = reminderDates(7);

        if (appt.slotDate === slotDateToday) {
          reminderMsg = `REMINDER: Your appointment with Dr. ${appt.docData?.name} is today at ${appt.slotTime}.`;
        } else if (appt.isCrucial && appt.slotDate === slotDate1Day) {
          reminderMsg = `REMINDER: Your appointment with Dr. ${appt.docData?.name} is tomorrow.`;
        } else if (appt.isCrucial && appt.slotDate === slotDate3Days) {
          reminderMsg = `REMINDER: You have an appointment with Dr. ${appt.docData?.name} in 3 days.`;
        } else if (appt.isCrucial && appt.slotDate === slotDate7Days) {
          reminderMsg = `REMINDER: You have an appointment with Dr. ${appt.docData?.name} in 7 days.`;
        }

        if (reminderMsg) {
          if (patientEmail) {
            await sendEmail(patientEmail, "Appointment Reminder", reminderMsg);
          }
          if (patientPhone) {
            await sendSms(patientPhone, reminderMsg);
          }
        }
      }
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

// Start the server once
app.listen(port, () => console.log(`Server started on PORT:${port}`));
