// "use strict";

// const $ = (id) => document.getElementById(id);

// let currentMode = "ttt";
// let mediaRecorder = null;
// let audioChunks = [];
// let isRecording = false;
// let recordingMode = null;
// let currentAudio = null;

// const speechTiming = {
//     stt : null,
//     sts : null
// };

// const modes = {
//     ttt: {
//         title: "Let's have a conversation",
//         description: "Send a message and get an AI response.",
//         instruction: "Type your message below",
//         pill: "TTT MODE"
//     },
//     tts: {
//         title: "Let me speak the answer",
//         description: "Type a question and listen to the AI response.",
//         instruction: "Type your question below",
//         pill: "TTS MODE"
//     },
//     stt: {
//         title: "Speech to text",
//         description: "Convert your spoken words into text.",
//         instruction: "Tap the microphone and start speaking",
//         pill: "STT MODE"
//     },
//     sts: {
//         title: "Talk with your AI",
//         description: "Speak to AI and listen to its response.",
//         instruction: "Tap the microphone and start speaking",
//         pill: "STS MODE"
//     }
// };

// const methodNames = {
//     ttt: "Text-to-Text",
//     tts: "Text-to-Speech",
//     stt: "Speech-to-Text",
//     sts: "Speech-to-Speech"
// };

// function setStatus(message) {
//     const status = $("status");
//     if (status) status.textContent = message;
// }

// function showMode(mode) {
//     if (!modes[mode]) return;

//     if (isRecording) stopRecording();

//     currentMode = mode;

//     document.querySelectorAll(".mode-card").forEach((card) => {
//         const active = card.dataset.mode === mode;
//         card.classList.toggle("active", active);
//         card.setAttribute("aria-pressed", String(active));
//     });

//     const panels = {
//         ttt: "tttPanel",
//         tts: "ttsPanel",
//         stt: "sttPanel",
//         sts: "stsPanel"
//     };

//     Object.entries(panels).forEach(([key, id]) => {
//         $(id)?.classList.toggle("hidden", key !== mode);
//     });

//     if ($("panelTitle")) $("panelTitle").textContent = modes[mode].title;
//     if ($("panelDescription")) {
//         $("panelDescription").textContent = modes[mode].description;
//     }
//     if ($("modePill")) $("modePill").textContent = modes[mode].pill;

//     const instruction = $("modeInstruction");
//     if (instruction?.lastChild) {
//         instruction.lastChild.textContent = " " + modes[mode].instruction;
//     }

//     setStatus("");
// }

// function addMessage(role, text) {
//     const conversation = $("conversation");
//     if (!conversation) {
//         console.error("Conversation element #conversation not found.");
//         return;
//     }

//     $("welcomeMessage")?.classList.add("hidden");

//     const message = document.createElement("div");
//     message.className = `message ${role}`;

//     const content = document.createElement("div");
//     content.className = "message-content";
//     content.textContent = text;

//     message.appendChild(content);
//     conversation.appendChild(message);
//     if (role === "assistant" && bookingState.step === "confirm") {
//         addBookingConfirmationCard();
//     }
//     conversation.scrollTop = conversation.scrollHeight;
// }

// function waitForScreenUpdate() {
//     return new Promise((resolve) => {
//         requestAnimationFrame(() => {
//             requestAnimationFrame(resolve);
//         });
//     });
// }

// async function postJson(url, payload) {
//     const response = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//     });

//     if (!response.ok) {
//         throw new Error(
//             `${url} returned ${response.status}: ${await response.text()}`
//         );
//     }

//     return response.json();
// }


// let bookingState = {
//     active: false,
//     step: null,
//     specialty: "",
//     appointmentDate: "",
//     suggestions: [],
//     selected: null,
//     patientName: "",
//     phone: ""
// };

// function resetBooking() {
//     bookingState = {
//         active: false,
//         step: null,
//         specialty: "",
//         appointmentDate: "",
//         suggestions: [],
//         selected: null,
//         patientName: "",
//         phone: ""
//     };
// }

// function isBookingRequest(message) {
//     return /\b(book|booking|appointment|schedule a visit|doctor appointment)\b/i.test(message);
// }

// function parseAppointmentDate(text) {
//     const value = String(text || "").trim().toLowerCase();

//     const formatDate = (date) => {
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, "0");
//         const day = String(date.getDate()).padStart(2, "0");

//         return `${year}-${month}-${day}`;
//     };

//     if (value === "today") {
//         return formatDate(new Date());
//     }

//     if (value === "tomorrow") {
//         const tomorrow = new Date();
//         tomorrow.setDate(tomorrow.getDate() + 1);
//         return formatDate(tomorrow);
//     }

//     const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
//     if (!match) return null;

//     const year = Number(match[1]);
//     const month = Number(match[2]);
//     const day = Number(match[3]);

//     const parsed = new Date(year, month - 1, day);

//     if (
//         parsed.getFullYear() !== year ||
//         parsed.getMonth() !== month - 1 ||
//         parsed.getDate() !== day
//     ) {
//         return null;
//     }

//     return `${match[1]}-${match[2]}-${match[3]}`;
// }


// async function getBookingReply(message) {
//     const text = message.trim();

//     if (!bookingState.active) {
//         if (!isBookingRequest(text)) return null;

//         bookingState.active = true;
//         bookingState.step = "specialty";

//         return "Sure, I can help you book an appointment. Which doctor's specialty do you need, for example Cardiology, Dermatology, or General Physician?";
//     }

//     if (/^(cancel|cancel booking|stop booking|never mind)$/i.test(text)) {
//         resetBooking();
//         return "Okay, the booking process has been cancelled. No appointment was created.";
//     }

//     if (bookingState.step === "specialty") {
//         bookingState.specialty = text;
//         bookingState.step = "date";

//         return "Which date would you prefer? Please enter YYYY-MM-DD, or say today or tomorrow.";
//     }

//     if (bookingState.step === "date") {
//         const selectedDate = parseAppointmentDate(text);

//         if (!selectedDate) {
//             return "Please enter a valid date in YYYY-MM-DD format, or say today or tomorrow.";
//         }

//         const today = new Date().toLocaleDateString("en-CA");

//         if (selectedDate < today) {
//             return "That date has passed. Please choose today, tomorrow, or a future date.";
//         }

//         bookingState.appointmentDate = selectedDate;

//         const params = new URLSearchParams({
//             specialty: bookingState.specialty,
//             appointment_date: selectedDate
//         });

//         const response = await fetch(`/api/booking/suggestions?${params}`);
//         if (!response.ok) {
//             throw new Error("Could not retrieve available appointment slots.");
//         }

//         const data = await response.json();
//         bookingState.suggestions = data.suggestions || [];

//         if (!bookingState.suggestions.length) {
//             bookingState.step = "specialty";
//             return `No available slots were found for ${bookingState.specialty} on ${selectedDate}. Please enter another specialty to try again, or type cancel.`;
//         }

//         bookingState.step = "slot";

//         const options = bookingState.suggestions
//             .map((slot, index) =>
//                 `${index + 1}. ${slot.doctor_name} (${slot.specialty}) — ${slot.date} at ${slot.time}`
//             )
//             .join("\n");

//         return `These are the available database slots:\n${options}\n\nReply with the option number you want.`;
//     }

//     if (bookingState.step === "slot") {
//         const choice = Number(text);

//         if (!Number.isInteger(choice) || choice < 1 ||
//             choice > bookingState.suggestions.length) {
//             return "Please reply with one of the listed option numbers.";
//         }

//         bookingState.selected = bookingState.suggestions[choice - 1];
//         bookingState.step = "name";

//         return `You selected ${bookingState.selected.doctor_name} at ${bookingState.selected.time}. What is the patient's full name?`;
//     }

//     if (bookingState.step === "name") {
//         if (text.length < 2 || text.length > 150) {
//             return "Please enter a valid patient name.";
//         }

//         bookingState.patientName = text;
//         bookingState.step = "phone";

//         return "Please enter the patient's phone number, including country code if needed.";
//     }

//     if (bookingState.step === "phone") {
//         const phone = text.trim();

//         if (!/^[+\d][\d\s()+-]{6,19}$/.test(phone)) {
//             return "That phone number doesn't look valid. Please enter it again.";
//         }

//         bookingState.phone = phone;
//         bookingState.step = "confirm";

//         const slot = bookingState.selected;

//         return `Please review the appointment details shown below. No appointment has been booked yet. Confirm only if all details are correct.`;
//     }

//     if (bookingState.step === "confirm") {
//         return "Please use the Confirm Booking button below to create the appointment, or type cancel to stop.";
//     }

//     return "Let's start again. Type book appointment to begin.";
// }

// function addBookingConfirmationCard() {
//     if (bookingState.step !== "confirm" || !bookingState.selected) return;
//     if ($("bookingConfirmationCard")) return;

//     const slot = bookingState.selected;
//     const card = document.createElement("div");
//     card.id = "bookingConfirmationCard";
//     card.className = "message assistant";

//     const content = document.createElement("div");
//     content.className = "message-content";
//     content.style.whiteSpace = "pre-line";
//     content.textContent =
//         `Confirm Appointment\n\n` +
//         `Patient: ${bookingState.patientName}\n` +
//         `Phone: ${bookingState.phone}\n` +
//         `Doctor: ${slot.doctor_name}\n` +
//         `Specialty: ${slot.specialty}\n` +
//         `Date: ${slot.date}\n` +
//         `Time: ${slot.time}\n\n` +
//         `This is a request for confirmation. The appointment is not booked yet.`;

//     const confirmButton = document.createElement("button");
//     confirmButton.type = "button";
//     confirmButton.textContent = "Confirm Booking";
//     confirmButton.className = "send-button";
//     confirmButton.style.marginTop = "12px";

//     const cancelButton = document.createElement("button");
//     cancelButton.type = "button";
//     cancelButton.textContent = "Cancel";
//     cancelButton.style.margin = "12px 0 0 8px";

//     confirmButton.addEventListener("click", async () => {
//         confirmButton.disabled = true;
//         cancelButton.disabled = true;
//         setStatus("Confirming appointment...");

//         try {
//             const result = await postJson("/api/booking/confirm", {
//                 patient_name: bookingState.patientName,
//                 phone: bookingState.phone,
//                 doctor_id: slot.doctor_id,
//                 slot_id: slot.slot_id,
//                 confirmed: true
//             });

//             const appointment = result.appointment;

//             content.textContent =
//                 `Appointment booked successfully!\n\n` +
//                 `Appointment ID: ${appointment.appointment_id}\n` +
//                 `Patient: ${appointment.patient_name}\n` +
//                 `Doctor: ${appointment.doctor_name}\n` +
//                 `Specialty: ${appointment.specialty}\n` +
//                 `Date: ${appointment.date}\n` +
//                 `Time: ${appointment.time}\n` +
//                 `Status: ${appointment.status}`;

//             confirmButton.remove();
//             cancelButton.remove();
//             resetBooking();
//             setStatus("Appointment booked successfully.");
//         } catch (error) {
//             console.error("Booking confirmation failed:", error);
//             content.textContent +=
//                 "\n\nBooking failed: the slot may no longer be available. Please start a new booking.";
//             confirmButton.remove();
//             cancelButton.remove();
//             resetBooking();
//             setStatus("Booking failed. No success was reported.");
//         }
//     });

//     cancelButton.addEventListener("click", () => {
//         resetBooking();
//         card.remove();
//         addMessage("assistant", "Booking cancelled. No appointment was created.");
//         setStatus("Booking cancelled.");
//     });

//     card.appendChild(content);
//     card.appendChild(confirmButton);
//     card.appendChild(cancelButton);

//     const conversation = $("conversation");
//     conversation?.appendChild(card);

//     if (conversation) conversation.scrollTop = conversation.scrollHeight;
// }


// async function getAIResponse(message) {
//     const bookingReply = await getBookingReply(message);

//     if (bookingReply !== null) {
//         return {
//             reply: bookingReply,
//             backendSeconds: 0
//         };
//     }

//     const data = await postJson("/api/chat", { message });

//     if (!data.reply) {
//         throw new Error("The AI returned an empty response.");
//     }

//     return {
//         reply: data.reply,
//         backendSeconds: Number(data.backend_seconds || 0)
//     };
// }


// // -------------------- TIMING / METADATA --------------------

// function createTimingPayload(
//     method,
//     userInput,
//     aiResponse,
//     totalLatency,
//     audio = {},
//     aiResponseTime = totalLatency,
//     aiBackendTime = 0,
//     extra = {}
// ) {
//     return {
//         method,
//         user_input: userInput,
//         ai_response: aiResponse,
//         timings: {
//             total_latency_seconds: totalLatency,
//             total_time_seconds: totalLatency,
//             response_latency_seconds: totalLatency,
//             ai_response_time_seconds: aiResponseTime,
//             ai_backend_time_seconds: aiBackendTime,
//             ...extra,
//             ...audio
//         }
//     };
// }

// function addTimingDetails(data) {
//     const conversation = $("conversation");
//     if (!conversation) return;

//     const assistants = conversation.querySelectorAll(".message.assistant");
//     const target = assistants[assistants.length - 1];
//     if (!target) return;

//     target.querySelector(".timing-details")?.remove();

//     const timings = data.timings || {};
//     const panel = document.createElement("div");
//     panel.className = "timing-details";
//     panel.style.cssText =
//         "margin-top:10px;padding:10px;border-radius:10px;" +
//         "background:rgba(127,127,127,0.10);font-size:12px;" +
//         "line-height:1.8;white-space:pre-line;";

//     const fmt = (key, digits = 2) =>
//         `${Number(timings[key] || 0).toFixed(digits)} sec`;

//     const lines = [
//         `Method: ${data.method}`,
//         `AI Response Time: ${fmt("ai_response_time_seconds")}`,
//         `AI Backend Time: ${fmt("ai_backend_time_seconds")}`
//     ];

//     if (data.method === "Speech-to-Text" ||
//         data.method === "Speech-to-Speech") {
//         lines.push(
//             `Recording Time: ${fmt("recording_time_seconds")}`,
//             `Transcription Time: ${fmt("transcription_time_seconds")}`
//         );
//     }

//     if (data.method === "Text-to-Speech" ||
//         data.method === "Speech-to-Speech") {
//         lines.push(
//             `Voice Generation Time: ${fmt("voice_generation_time_seconds")}`,
//             `Audio Download Time: ${fmt("audio_download_time_seconds", 3)}`
//         );
//     }

//     lines.push(`TOTAL LATENCY: ${fmt("total_latency_seconds")}`);
//     panel.textContent = lines.join("\n");
//     target.appendChild(panel);
// }

// async function writeTimingSummary(data) {
//     const timing = data.timings || {};
//     const fmt = (key, digits = 2) =>
//         `${Number(timing[key] || 0).toFixed(digits)} seconds`;

//     const lines = [
//         "=".repeat(50),
//         "TIMING SUMMARY",
//         `Method: ${data.method}`,
//         `User Input: ${data.user_input}`,
//         `AI Response: ${data.ai_response}`,
//         "",
//         `AI Response Time: ${fmt("ai_response_time_seconds")}`,
//         `AI Backend Time: ${fmt("ai_backend_time_seconds")}`
//     ];

//     if (data.method === "Speech-to-Text" ||
//         data.method === "Speech-to-Speech") {
//         lines.push(
//             `Recording Time: ${fmt("recording_time_seconds")}`,
//             `Transcription Time: ${fmt("transcription_time_seconds")}`
//         );
//     }

//     if (data.method === "Text-to-Speech" ||
//         data.method === "Speech-to-Speech") {
//         lines.push(
//             `Voice Generation Time: ${fmt("voice_generation_time_seconds")}`,
//             `Audio Download Time: ${fmt("audio_download_time_seconds", 3)}`,
//             `Audio Duration: ${fmt("audio_duration_seconds")}`
//         );
//     }

//     lines.push(
//         "",
//         `TOTAL LATENCY: ${fmt("total_latency_seconds")}`,
//         "=".repeat(50)
//     );

//     console.log(lines.join("\n"));
//     addTimingDetails(data);

//     try {
//         await postJson("/api/metadata-log", data);
//     } catch (error) {
//         console.error("Could not save timing summary:", error);
//     }
// }

// // -------------------- TTT --------------------

// function seconds(startedAt) {
//     return (performance.now() - startedAt) / 1000;
// }

// async function sendMessage(text) {
//     const input = $("tttInput");
//     if (!input && text == null) return;

//     const messageText = (text ?? input.value).trim();

//     if (!messageText) {
//         setStatus("Please type a message first.");
//         return;
//     }

//     const button = $("sendButton");
//     if (button?.disabled) return;

//     // Start when Send is clicked.
//     const started = performance.now();

//     if (input) input.value = "";
//     addMessage("user", messageText);
//     setStatus("AI is thinking...");

//     if (button) button.disabled = true;

//     try {
//         const aiStarted = performance.now();
//         const aiResult = await getAIResponse(messageText);
//         const aiClientSeconds = seconds(aiStarted);
//         const reply = aiResult.reply;

//         addMessage("assistant", reply);
//         await waitForScreenUpdate();

//         // Stop after the AI text response is rendered.
//         const totallatency = seconds(started);

//         const timingData =  createTimingPayload(
//                 methodNames.ttt,
//                 messageText,
//                 reply,
//                 totallatency,
//                 {},
//                 aiClientSeconds,
//                 aiResult.backendSeconds
//             );
            
//         await writeTimingSummary(timingData);
//         setStatus(`AI response received in ${totallatency.toFixed(2)} seconds.`);
//     } catch (error) {
//         console.error("TTT error:", error);
//         setStatus("Could not get an AI response. Please try again.");
//     } finally {
//         if (button) button.disabled = false;
//     }
// }

// // -------------------- AUDIO PLAYBACK --------------------


// function playAudioBlob(blob) {
//     if (currentAudio) {
//         currentAudio.pause();
//         currentAudio = null;
//     }

//     const audioUrl = URL.createObjectURL(blob);
//     const audio = new Audio(audioUrl);
//     currentAudio = audio;

//     const cleanup = () => {
//         URL.revokeObjectURL(audioUrl);
//         if (currentAudio === audio) currentAudio = null;
//     };

//     audio.addEventListener("ended", cleanup, { once: true });
//     audio.addEventListener("error", cleanup, { once: true });

//     const playbackPromise = audio.play().catch((error) => {
//         cleanup();
//         console.error("Audio playback failed:", error);
//     });

//     return { audio, playbackPromise };
// }


// async function responseToAudio(text) {
//     const requestStarted = performance.now();

//     if (currentAudio) {
//         currentAudio.pause();
//         currentAudio = null;
//     }

//     const response = await fetch("/api/tts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text })
//     });

//     if (!response.ok) {
//         throw new Error(
//             `TTS error ${response.status}: ${await response.text()}`
//         );
//     }

//     const backendSeconds = Number(
//         response.headers.get("X-TTS-Backend-Seconds") || 0
//     );

//     // Fallback for browsers that do not support MPEG audio streaming.
//     if (
//         !window.MediaSource ||
//         !MediaSource.isTypeSupported("audio/mpeg") ||
//         !response.body
//     ) {
//         const blob = await response.blob();

//         if (!blob.size) {
//             throw new Error("The generated audio is empty.");
//         }

//         const downloadSeconds = Math.max(
//             0,
//             seconds(requestStarted) - backendSeconds
//         );

//         const playback = playAudioBlob(blob);

//         const audioDuration = await new Promise((resolve) => {
//             const audio = playback.audio;

//             if (audio.readyState >= 1) {
//                 resolve(
//                     Number.isFinite(audio.duration) ? audio.duration : 0
//                 );
//                 return;
//             }

//             audio.addEventListener("loadedmetadata", () => {
//                 resolve(
//                     Number.isFinite(audio.duration) ? audio.duration : 0
//                 );
//             }, { once: true });

//             audio.addEventListener("error", () => resolve(0), {
//                 once: true
//             });
//         });

//         return {
//             voice_generation_time_seconds: backendSeconds,
//             audio_download_time_seconds: downloadSeconds,
//             audio_duration_seconds: audioDuration
//         };
//     }

//     // Stream audio chunks directly into the browser's audio player.
//     const mediaSource = new MediaSource();
//     const audioUrl = URL.createObjectURL(mediaSource);
//     const audio = new Audio();

//     audio.preload = "auto";
//     audio.src = audioUrl;
//     currentAudio = audio;

//     let cleanedUp = false;
//     let firstChunkSeconds = 0;
//     let playbackStarted = false;

//     const cleanup = () => {
//         if (cleanedUp) return;

//         cleanedUp = true;
//         URL.revokeObjectURL(audioUrl);

//         if (currentAudio === audio) {
//             currentAudio = null;
//         }
//     };

//     audio.addEventListener("ended", cleanup, { once: true });
//     audio.addEventListener("error", cleanup, { once: true });

//     try {
//         await new Promise((resolve, reject) => {
//             mediaSource.addEventListener("sourceopen", resolve, {
//                 once: true
//             });

//             mediaSource.addEventListener("error", () => {
//                 reject(new Error("Could not initialize audio streaming."));
//             }, { once: true });
//         });

//         const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
//         const reader = response.body.getReader();

//         async function appendChunk(chunk) {
//             await new Promise((resolve, reject) => {
//                 const onUpdateEnd = () => {
//                     cleanupListeners();
//                     resolve();
//                 };

//                 const onError = () => {
//                     cleanupListeners();
//                     reject(new Error("Could not process an audio chunk."));
//                 };

//                 const cleanupListeners = () => {
//                     sourceBuffer.removeEventListener(
//                         "updateend", onUpdateEnd
//                     );
//                     sourceBuffer.removeEventListener("error", onError);
//                 };

//                 sourceBuffer.addEventListener("updateend", onUpdateEnd);
//                 sourceBuffer.addEventListener("error", onError);

//                 try {
//                     sourceBuffer.appendBuffer(chunk);
//                 } catch (error) {
//                     cleanupListeners();
//                     reject(error);
//                 }
//             });
//         }

//         while (true) {
//             const { value, done } = await reader.read();

//             if (done) break;
//             if (!value || value.byteLength === 0) continue;

//             if (firstChunkSeconds === 0) {
//                 firstChunkSeconds = seconds(requestStarted);
//             }

//             await appendChunk(value);

//             // Begin playback as soon as the first chunk is appended.
//             if (!playbackStarted) {
//                 playbackStarted = true;

//                 audio.play().catch((error) => {
//                     console.error("Audio playback failed:", error);
//                 });
//             }
//         }

//         if (!playbackStarted) {
//             throw new Error("The generated audio stream was empty.");
//         }

//         if (mediaSource.readyState === "open") {
//             mediaSource.endOfStream();
//         }

//         const audioDuration = await new Promise((resolve) => {
//             const readDuration = () => {
//                 if (
//                     audio.readyState >= 1 &&
//                     Number.isFinite(audio.duration)
//                 ) {
//                     resolve(audio.duration);
//                     return true;
//                 }

//                 return false;
//             };

//             if (readDuration()) return;

//             const onMetadata = () => {
//                 if (readDuration()) {
//                     clearTimeout(timeoutId);
//                     audio.removeEventListener(
//                         "loadedmetadata", onMetadata
//                     );
//                     audio.removeEventListener(
//                         "durationchange", onMetadata
//                     );
//                 }
//             };

//             const timeoutId = setTimeout(() => {
//                 audio.removeEventListener(
//                     "loadedmetadata", onMetadata
//                 );
//                 audio.removeEventListener(
//                     "durationchange", onMetadata
//                 );
//                 resolve(0);
//             }, 2000);

//             audio.addEventListener("loadedmetadata", onMetadata);
//             audio.addEventListener("durationchange", onMetadata);
//             onMetadata();
//         });

//         return {
//             // Time until the first audio chunk is available.
//             voice_generation_time_seconds: firstChunkSeconds,

//             // Remaining time spent receiving the audio stream.
//             audio_download_time_seconds: Math.max(
//                 0,
//                 seconds(requestStarted) - firstChunkSeconds
//             ),

//             audio_duration_seconds: audioDuration
//         };
//     } catch (error) {
//         audio.pause();
//         cleanup();
//         throw error;
//     }
// }

// // -------------------- TTS --------------------

// async function speakText() {
//     const input = $("ttsInput");
//     if (!input) return;

//     const text = input.value.trim();

//     if (!text) {
//         setStatus("Please type your question first.");
//         input.focus();
//         return;
//     }

//     const button = $("speakButton");
//     if (button?.disabled) return;

//     // Latency starts at the Speak button click.
//     const started = performance.now();

//     input.value = "";
//     if (button) button.disabled = true;

//     addMessage("user", text);
//     setStatus("Generating AI text response...");

//     try {
//         const aiStarted = performance.now();
//         const aiResult = await getAIResponse(text);
//         const aiClientSeconds = seconds(aiStarted);
//         const reply = aiResult.reply;

//         addMessage("assistant", reply);
//         await waitForScreenUpdate();

//         setStatus("Generating voice ....");

//         const audioMetrics = await responseToAudio(reply);
//         const totallatency = seconds(started);

//         const timingData = createTimingPayload(
//             methodNames.tts,
//             text,
//             reply,
//             totallatency,
//             audioMetrics,
//             aiClientSeconds,
//             aiResult.backendSeconds
//         );

//         await writeTimingSummary(timingData);

//         setStatus(
//             `AI audio ready in ${totallatency.toFixed(2)} seconds.`
//         );
//     } catch (error) {
//         console.error("TTS error:", error);
//         setStatus("AI response or audio generation failed. Please try again.");
//     }finally {
//         if (button) button.disabled = false;
//     }
// }

// //         let audioMetrics = {};

// //         try {
// //             audioMetrics = await responseToAudio(reply);
// //         } catch (audioError) {
// //             console.error("TTS audio error:", audioError);
// //         }

// //         timingData.timings = {
// //             ...timingData.timings,
// //             ...audioMetrics
// //         };

// //         await writeTimingSummary(timingData);

// //         setStatus(
// //             `AI text response latency: ${latency.toFixed(2)} seconds.` +
// //             (audioMetrics.audio_duration_seconds !== undefined
// //                 ? " Voice playback completed."
// //                 : " Audio generation or playback failed.")
// //         );
// //     } catch (error) {
// //         console.error("TTS error:", error);
// //         setStatus("Could not get the AI text response. Please try again.");
// //     } finally {
// //         if (button) button.disabled = false;
// //     }
// // }

// // -------------------- STT / STS TRANSCRIPT CONTROLS --------------------

// function ensureTranscriptControls(mode) {
//     const panel = $(mode === "stt" ? "sttPanel" : "stsPanel");

//     if (!panel) {
//         console.error("Transcript panel not found:", mode);
//         return;
//     }

//     const prefix = mode === "stt" ? "stt" : "sts";
//     const textareaId = `${prefix}TranscriptInput`;
//     const buttonId = `${prefix}SendButton`;

//     let textarea = $(textareaId);

//     if (!textarea) {
//         textarea = document.createElement("textarea");
//         textarea.id = textareaId;
//         textarea.rows = 3;
//         textarea.placeholder =
//             "Your transcript will appear here. Review or edit it.";
//         textarea.setAttribute("aria-label", "Review transcript");
//         textarea.style.width = "100%";
//         textarea.style.marginTop = "12px";
//         panel.appendChild(textarea);
//     }

//     let button = $(buttonId);

//     if (!button) {
//         button = document.createElement("button");
//         button.id = buttonId;
//         button.type = "button";
//         button.className = "send-button";
//         button.textContent = mode === "stt" ? "Send to AI" : "Send & Speak";
//         button.style.marginTop = "10px";
//         panel.appendChild(button);
//     }

//     // Bind the button whether it was created here or existed in HTML.
//     if (button.dataset.handlerAttached !== "true") {
//         button.dataset.handlerAttached = "true";

//         button.addEventListener("click", () => {
//             submitTranscriptFromInput(mode, textareaId, buttonId);
//         });
//     }

//     // Enter sends; Shift+Enter inserts a new line.
//     if (textarea.dataset.enterHandlerAttached !== "true") {
//         textarea.dataset.enterHandlerAttached = "true";

//         textarea.addEventListener("keydown", (event) => {
//             if (event.key === "Enter" && !event.shiftKey) {
//                 event.preventDefault();
//                 submitTranscriptFromInput(mode, textareaId, buttonId);
//             }
//         });
//     }
// }

// function submitTranscriptFromInput(mode, textareaId, buttonId) {
//     const textarea = $(textareaId);
//     const button = $(buttonId);
//     const text = textarea?.value.trim();

//     if (!text) {
//         setStatus("Transcript is empty. Please speak again.");
//         return;
//     }

//     if (button?.disabled) return;

//     console.log(`[${mode.toUpperCase()}] Sending transcript to AI:`, text);

//     submitConfirmedTranscript(text, mode === "sts");
// }

// // -------------------- MICROPHONE RECORDING --------------------

// async function startRecording(mode) {
//     if (isRecording) return;

//     if (!navigator.mediaDevices?.getUserMedia) {
//         setStatus("Microphone requires localhost or HTTPS.");
//         return;
//     }

//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//             audio: true
//         });

//         audioChunks = [];
//         recordingMode = mode;

//         const mimeType = MediaRecorder.isTypeSupported("audio/webm")
//             ? "audio/webm"
//             : "";

//         mediaRecorder = mimeType
//             ? new MediaRecorder(stream, { mimeType })
//             : new MediaRecorder(stream);

//         const recorder = mediaRecorder;

//         recorder.ondataavailable = (event) => {
//             if (event.data?.size > 0) audioChunks.push(event.data);
//         };

//         recorder.onstop = async () => {
//             const blob = new Blob(audioChunks, {
//                 type: recorder.mimeType || "audio/webm"
//             });

//             stream.getTracks().forEach((track) => track.stop());

//             if (speechTiming[mode]?.startedAt != null) {
//                 speechTiming[mode].recording_time_seconds =
//                     seconds(speechTiming[mode].startedAt);
//             }
//             isRecording = false;
//             updateRecordingUI(mode, false);

//             if (!blob.size) {
//                 setStatus("No audio captured. Please try again.");
//                 return;
//             }

//             await transcribeAudio(blob, mode);
//         };

//         speechTiming[mode] ={
//             startedAt: performance.now(),
//             recording_time_seconds: 0,
//             transcription_time_seconds: 0,
//             transcription_backend_seconds: 0
//         };
//         recorder.start();
//         isRecording = true;
//         updateRecordingUI(mode, true);
//         setStatus("Recording... tap the microphone again to stop.");
//     } catch (error) {
//         console.error("Recording error:", error);
//         setStatus("Microphone permission denied or unavailable.");
//     }
// }

// function stopRecording() {
//     if (mediaRecorder && isRecording) {
//         mediaRecorder.stop();
//     }
// }

// function toggleRecording(mode) {
//     if (isRecording) {
//         if (recordingMode === mode) stopRecording();
//         return;
//     }

//     startRecording(mode);
// }

// function updateRecordingUI(mode, recording) {
//     const button = $(
//         mode === "stt" ? "sttRecordButton" : "stsRecordButton"
//     );
//     const heading = $(
//         mode === "stt" ? "sttVoiceTitle" : "stsVoiceTitle"
//     );
//     const wave = $(
//         mode === "stt" ? "sttWave" : "stsWave"
//     );

//     if (button) {
//         button.classList.toggle("recording", recording);
//         button.setAttribute("aria-pressed", String(recording));
//     }

//     if (heading) {
//         heading.textContent = recording
//             ? "Recording... tap to stop"
//             : mode === "stt"
//                 ? "Tap the mic to start"
//                 : "Tap to talk to your AI";
//     }

//     wave?.classList.toggle("active", recording);
// }

// // -------------------- STT TRANSCRIPTION --------------------

// async function transcribeAudio(blob, mode) {
//     const transcriptionStarted = performance.now();
//     setStatus("Converting speech to text...");

//     try {
//         const formData = new FormData();
//         formData.append("audio", blob, "recording.webm");

//         const response = await fetch("/api/stt", {
//             method: "POST",
//             body: formData
//         });

//         if (!response.ok) {
//             throw new Error(
//                 `STT error ${response.status}: ${await response.text()}`
//             );
//         }

//         const data = await response.json();
//         const transcript = (data.text || "").trim();
//         const previous = speechTiming[mode] || {};

//         speechTiming[mode] = {
//             ...previous,
//             transcription_time_seconds: seconds(transcriptionStarted),
//             transcription_backend_seconds: 
//                 Number(data.backend_seconds || 0)
//         };

//         if (!transcript) {
//             setStatus("No speech detected. Please try again.");
//             return;
//         }

//         ensureTranscriptControls(mode);

//         const textarea = $(
//             mode === "stt" ? "sttTranscriptInput" : "stsTranscriptInput"
//         );

//         if (!textarea) {
//             throw new Error(`Transcript textarea not found for ${mode}.`);
//         }

//         textarea.value = transcript;
//         textarea.focus();

//         setStatus(
//             "Transcript ready. Press Enter or click the send button to continue."
//         );

//         console.log(`[${mode.toUpperCase()}] Transcript ready:`, transcript);
//     } catch (error) {
//         console.error("Transcription error:", error);
//         setStatus("Speech transcription failed. Please try again.");
//     }
// }

// // -------------------- CONFIRMED STT / STS --------------------

// async function submitConfirmedTranscript(text, speakReply) {
//     const mode = speakReply ? "sts" : "stt";
//     const button = $(
//         speakReply ? "stsSendButton" : "sttSendButton"
//     );

//     if (button?.disabled) return;

//     // Start this stage when the user confirms/sends the transcript.
//     const confirmedStarted = performance.now();

//     addMessage("user", text);
//     setStatus("AI is preparing a response...");

//     if (button) button.disabled = true;

//     try {
//         const aiStarted = performance.now();
//         const aiResult = await getAIResponse(text);
//         const aiClientSeconds = seconds(aiStarted);
//         const reply = aiResult.reply;

//         addMessage("assistant", reply);
//         await waitForScreenUpdate();

//         let audioMetrics = {};

//         if (speakReply) {
//             setStatus("Generating voice...");

//             audioMetrics = await responseToAudio(reply);
//         }

//         // Time from transcript confirmation until text/audio is ready.
//         const confirmedToReadySeconds = seconds(confirmedStarted);

//         // Add the separate recording and transcription stages.
//         // User review/editing time between transcript and Send is excluded.
//         const speech = speechTiming[mode] || {};
//         const recordingSeconds =
//             Number(speech.recording_time_seconds || 0);
//         const transcriptionSeconds =
//             Number(speech.transcription_time_seconds || 0);

//         const totalLatency =
//             recordingSeconds +
//             transcriptionSeconds +
//             confirmedToReadySeconds;

//         const extra = {
//             recording_time_seconds: recordingSeconds,
//             transcription_time_seconds: transcriptionSeconds,
//             transcription_backend_time_seconds:
//                 Number(speech.transcription_backend_time_seconds || 0),
//             confirmed_to_ready_seconds: confirmedToReadySeconds
//         };

//         const timingData = createTimingPayload(
//             methodNames[mode],
//             text,
//             reply,
//             totalLatency,
//             audioMetrics,
//             aiClientSeconds,
//             aiResult.backendSeconds,
//             extra
//         );

//         await writeTimingSummary(timingData);

//         setStatus(
//             speakReply
//                 ? `Speech-to-speech response ready in ${totalLatency.toFixed(2)} seconds.`
//                 : `Speech-to-text and AI response completed in ${totalLatency.toFixed(2)} seconds.`
//         );

//         speechTiming[mode] = null;
//     } catch (error) {
//         console.error(`${mode.toUpperCase()} error:`, error);
//         setStatus("Could not complete the AI response. Please try again.");
//     } finally {
//         if (button) button.disabled = false;
//     }
// }

// // -------------------- EVENT LISTENERS --------------------

// document.addEventListener("DOMContentLoaded", () => {
//     document.querySelectorAll(".mode-card").forEach((button) => {
//         button.addEventListener("click", () => {
//             showMode(button.dataset.mode);
//         });
//     });

//     if ($("sendButton")) {
//         $("sendButton").addEventListener("click", () => sendMessage());
//     }

//     if ($("tttInput")) {
//         $("tttInput").addEventListener("keydown", (event) => {
//             if (event.key === "Enter" && !event.shiftKey) {
//                 event.preventDefault();
//                 sendMessage();
//             }
//         });
//     }

//     if ($("speakButton")) {
//         $("speakButton").addEventListener("click", speakText);
//     }

//     if ($("sttRecordButton")) {
//         $("sttRecordButton").addEventListener("click", () => {
//             toggleRecording("stt");
//         });
//     }

//     if ($("stsRecordButton")) {
//         $("stsRecordButton").addEventListener("click", () => {
//             toggleRecording("sts");
//         });
//     }

//     ensureTranscriptControls("stt");
//     ensureTranscriptControls("sts");

//     document.querySelectorAll(".suggestion").forEach((button) => {
//         button.addEventListener("click", () => {
//             const prompt = button.dataset.prompt;

//             if (currentMode === "tts") {
//                 if ($("ttsInput")) {
//                     $("ttsInput").value = prompt;
//                     $("ttsInput").focus();
//                 }
//             } else {
//                 showMode("ttt");

//                 if ($("tttInput")) {
//                     $("tttInput").value = prompt;
//                     $("tttInput").focus();
//                 }
//             }
//         });
//     });

//     showMode("ttt");
// });

// // Support HTML onclick handlers.
// window.showMode = showMode;
// window.sendMessage = sendMessage;
// window.speakText = speakText;
// window.startRecording = startRecording;
// window.stopRecording = stopRecording;
// window.toggleRecording = toggleRecording;


"use strict";

const $ = (id) => document.getElementById(id);

let currentMode = "ttt";
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingMode = null;
let currentAudio = null;

const speechTiming = { stt: null, sts: null };

const modes = {
    ttt: {
        title: "Let's have a conversation",
        description: "Send a message and get an AI response.",
        instruction: "Type your message below",
        pill: "TTT MODE"
    },
    tts: {
        title: "Let me speak the answer",
        description: "Type a question and listen to the AI response.",
        instruction: "Type your question below",
        pill: "TTS MODE"
    },
    stt: {
        title: "Speech to text",
        description: "Convert your spoken words into text.",
        instruction: "Tap the microphone and start speaking",
        pill: "STT MODE"
    },
    sts: {
        title: "Talk with your AI",
        description: "Speak to AI and listen to its response.",
        instruction: "Tap the microphone and start speaking",
        pill: "STS MODE"
    }
};

const methodNames = {
    ttt: "Text-to-Text",
    tts: "Text-to-Speech",
    stt: "Speech-to-Text",
    sts: "Speech-to-Speech"
};

function setStatus(message) {
    const status = $("status");
    if (status) status.textContent = message;
}

function showMode(mode) {
    if (!modes[mode]) return;
    if (isRecording) stopRecording();

    currentMode = mode;

    document.querySelectorAll(".mode-card").forEach((card) => {
        const active = card.dataset.mode === mode;
        card.classList.toggle("active", active);
        card.setAttribute("aria-pressed", String(active));
    });

    const panels = {
        ttt: "tttPanel",
        tts: "ttsPanel",
        stt: "sttPanel",
        sts: "stsPanel"
    };

    Object.entries(panels).forEach(([key, id]) => {
        $(id)?.classList.toggle("hidden", key !== mode);
    });

    if ($("panelTitle")) {
        $("panelTitle").textContent = modes[mode].title;
    }

    if ($("panelDescription")) {
        $("panelDescription").textContent = modes[mode].description;
    }

    if ($("modePill")) {
        $("modePill").textContent = modes[mode].pill;
    }

    const instruction = $("modeInstruction");
    if (instruction?.lastChild) {
        instruction.lastChild.textContent = " " + modes[mode].instruction;
    }

    setStatus("");
}

function addMessage(role, text) {
    const conversation = $("conversation");

    if (!conversation) {
        console.error("Conversation element #conversation not found.");
        return;
    }

    $("welcomeMessage")?.classList.add("hidden");

    const message = document.createElement("div");
    message.className = `message ${role}`;

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = text;

    message.appendChild(content);
    conversation.appendChild(message);

    if (role === "assistant" && bookingState.step === "confirm") {
        addBookingConfirmationCard();
    }

    conversation.scrollTop = conversation.scrollHeight;
}

function waitForScreenUpdate() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
}

async function postJson(url, payload) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(
            `${url} returned ${response.status}: ${await response.text()}`
        );
    }

    return response.json();
}

// -------------------- APPOINTMENT BOOKING --------------------

let bookingState = {
    active: false,
    step: null,
    specialty: "",
    appointmentDate: "",
    requestedTime: "",
    suggestions: [],
    selected: null,
    patientName: "",
    phone: ""
};

function resetBooking() {
    bookingState = {
        active: false,
        step: null,
        specialty: "",
        appointmentDate: "",
        requestedTime: "",
        suggestions: [],
        selected: null,
        patientName: "",
        phone: ""
    };

    $("bookingFormCard")?.remove();
    $("bookingSlotOptions")?.remove();
    $("bookingConfirmationCard")?.remove();
}

function isBookingRequest(message) {
    return /\b(book|booking|appointment|schedule a visit|doctor appointment)\b/i
        .test(message);
}

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseAppointmentDate(text) {
    const value = String(text || "").trim().toLowerCase();

    if (value === "today") {
        return localDateString();
    }

    if (value === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return localDateString(tomorrow);
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const parsed = new Date(year, month - 1, day);

    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
    ) {
        return null;
    }

    return `${match[1]}-${match[2]}-${match[3]}`;
}

function createBookingField(labelText, id, type = "text", required = true) {
    const label = document.createElement("label");

    label.style.cssText =
        "display:block;margin-top:12px;font-size:14px;font-weight:600;";

    label.textContent = labelText;

    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    input.required = required;

    input.style.cssText =
        "display:block;width:100%;box-sizing:border-box;margin-top:6px;" +
        "padding:11px;border:1px solid #ccd3df;border-radius:8px;font:inherit;";

    if (type === "date") {
        input.min = localDateString();
    }

    label.appendChild(input);

    return { label, input };
}

function createBookingForm() {
    $("bookingFormCard")?.remove();
    $("bookingSlotOptions")?.remove();
    $("bookingConfirmationCard")?.remove();

    bookingState.active = true;
    bookingState.step = "form";

    const card = document.createElement("div");
    card.id = "bookingFormCard";
    card.className = "message assistant";

    const content = document.createElement("div");
    content.className = "message-content";
    content.style.cssText = "width:100%;box-sizing:border-box;";

    const heading = document.createElement("h3");
    heading.textContent = "Book an Appointment";
    heading.style.marginTop = "0";

    const description = document.createElement("p");
    description.textContent =
        "Enter your details below. We will check availability only " +
        "for your selected department.";

    const form = document.createElement("form");
    form.id = "appointmentBookingForm";

    const name = createBookingField(
        "Patient full name",
        "bookingPatientName"
    );
    name.input.maxLength = 150;
    name.input.autocomplete = "name";

    const phone = createBookingField(
        "Mobile number",
        "bookingPatientPhone",
        "tel"
    );
    phone.input.placeholder = "Enter mobile number";
    phone.input.autocomplete = "tel";
    phone.input.maxLength = 20;

    const specialty = createBookingField(
        "Department / specialty",
        "bookingSpecialty"
    );
    specialty.input.placeholder = "e.g. Cardiology, Dermatology, ENT";
    specialty.input.autocomplete = "off";

    const date = createBookingField(
        "Preferred appointment date",
        "bookingDate",
        "date"
    );

    const time = createBookingField(
        "Preferred time (optional)",
        "bookingTime",
        "time",
        false
    );

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "send-button";
    submit.textContent = "Check Availability";
    submit.style.marginTop = "16px";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    cancel.style.margin = "16px 0 0 8px";

    const status = document.createElement("p");
    status.id = "bookingFormStatus";
    status.setAttribute("role", "status");

    form.append(
        name.label,
        phone.label,
        specialty.label,
        date.label,
        time.label,
        submit,
        cancel,
        status
    );

    content.append(heading, description, form);
    card.appendChild(content);

    $("conversation")?.appendChild(card);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const patientName = name.input.value.trim();
        const patientPhone = phone.input.value.trim();
        const selectedSpecialty = specialty.input.value.trim();
        const selectedDate = parseAppointmentDate(date.input.value);
        const preferredTime = time.input.value;

        if (patientName.length < 2 || patientName.length > 150) {
            status.textContent = "Please enter a valid patient name.";
            name.input.focus();
            return;
        }

        if (!/^[+\d][\d\s()+-]{6,19}$/.test(patientPhone)) {
            status.textContent = "Please enter a valid mobile number.";
            phone.input.focus();
            return;
        }

        if (!selectedSpecialty) {
            status.textContent = "Please enter a department or specialty.";
            specialty.input.focus();
            return;
        }

        if (!selectedDate || selectedDate < localDateString()) {
            status.textContent = "Please select today or a future date.";
            date.input.focus();
            return;
        }

        bookingState.patientName = patientName;
        bookingState.phone = patientPhone;
        bookingState.specialty = selectedSpecialty;
        bookingState.appointmentDate = selectedDate;
        bookingState.requestedTime = preferredTime;
        bookingState.selected = null;
        bookingState.suggestions = [];
        bookingState.step = "checking";

        submit.disabled = true;
        status.textContent = "Checking availability...";

        try {
            const datesToCheck = [];

            for (let offset = 0; offset < 7; offset++) {
                const checkDate = new Date(`${selectedDate}T12:00:00`);
                checkDate.setDate(checkDate.getDate() + offset);
                datesToCheck.push(localDateString(checkDate));
            }

            const slots = [];

            for (const checkDate of datesToCheck) {
                const params = new URLSearchParams({
                    specialty: selectedSpecialty,
                    appointment_date: checkDate,
                    requested_time: preferredTime || ""
                });

                const response = await fetch(
                    `/api/booking/suggestions?${params.toString()}`
                );

                if (!response.ok) {
                    throw new Error(
                        `Availability request failed (${response.status}).`
                    );
                }

                const data = await response.json();

                // Strict specialty filter: never display another department.
                const sameDepartment = (data.suggestions || []).filter((slot) =>
                    String(slot.specialty || "").trim().toLowerCase() ===
                    selectedSpecialty.toLowerCase()
                );

                slots.push(...sameDepartment);
            }

            const uniqueSlots = [
                ...new Map(
                    slots.map((slot) => [slot.slot_id, slot])
                ).values()
            ];

            uniqueSlots.sort((a, b) => {
                const dateA = `${a.date}T${a.time}`;
                const dateB = `${b.date}T${b.time}`;

                if (preferredTime) {
                    const aDiff = Math.abs(
                        timeToMinutes(a.time) - timeToMinutes(preferredTime)
                    );
                    const bDiff = Math.abs(
                        timeToMinutes(b.time) - timeToMinutes(preferredTime)
                    );

                    if (aDiff !== bDiff) {
                        return aDiff - bDiff;
                    }
                }

                return dateA.localeCompare(dateB);
            });

            bookingState.suggestions = uniqueSlots.slice(0, 10);

            card.remove();

            if (!bookingState.suggestions.length) {
                bookingState.step = "form";

                addMessage(
                    "assistant",
                    `No available slots were found in ${selectedSpecialty} ` +
                    `for ${selectedDate} or the following 6 days. ` +
                    "Please try another date or time. " +
                    "No other department has been suggested."
                );

                createBookingForm();
                setStatus("No suitable slots found.");
                return;
            }

            const exactMatch = bookingState.suggestions.some((slot) =>
                slot.date === selectedDate &&
                (!preferredTime || slot.time === preferredTime)
            );

            showBookingSlotOptions(
                exactMatch
                    ? `Available slots in ${selectedSpecialty}:`
                    : `Your preferred slot is unavailable. ` +
                      `These alternatives are from ${selectedSpecialty} only:`
            );

            setStatus("Select a slot to review your appointment.");
        } catch (error) {
            console.error("Availability check failed:", error);
            status.textContent =
                "Could not check availability. Please try again.";
            submit.disabled = false;
            bookingState.step = "form";
        }
    });

    cancel.addEventListener("click", () => {
        resetBooking();
        addMessage("assistant", "Booking cancelled. No appointment was created.");
    });

    const conversation = $("conversation");
    if (conversation) {
        conversation.scrollTop = conversation.scrollHeight;
    }
}

function timeToMinutes(value) {
    const [hours, minutes] = String(value || "").split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

function showBookingSlotOptions(intro) {
    $("bookingSlotOptions")?.remove();

    const card = document.createElement("div");
    card.id = "bookingSlotOptions";
    card.className = "message assistant";

    const content = document.createElement("div");
    content.className = "message-content";

    const heading = document.createElement("p");
    heading.textContent = intro;
    content.appendChild(heading);

    const note = document.createElement("p");
    note.textContent =
        `Department: ${bookingState.specialty}. ` +
        "Only matching department doctors are listed.";
    content.appendChild(note);

    bookingState.suggestions.forEach((slot, index) => {
        if (
            String(slot.specialty || "").trim().toLowerCase() !==
            bookingState.specialty.trim().toLowerCase()
        ) {
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "send-button";
        button.style.cssText =
            "display:block;width:100%;text-align:left;margin-top:8px;";

        button.textContent =
            `${index + 1}. ${slot.doctor_name} — ${slot.specialty} | ` +
            `${slot.date} at ${slot.time}`;

        button.addEventListener("click", () => {
            bookingState.selected = slot;
            bookingState.step = "confirm";
            card.remove();
            addBookingConfirmationCard();
        });

        content.appendChild(button);
    });

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel Booking";
    cancel.style.marginTop = "12px";

    cancel.addEventListener("click", () => {
        resetBooking();
        card.remove();
        addMessage("assistant", "Booking cancelled. No appointment was created.");
    });

    content.appendChild(cancel);
    card.appendChild(content);

    $("conversation")?.appendChild(card);

    const conversation = $("conversation");
    if (conversation) {
        conversation.scrollTop = conversation.scrollHeight;
    }
}

// -------------------- APPOINTMENT CANCELLATION --------------------

let cancellationState = {
    step: null,
    appointmentId: null
};

function isAppointmentCancellationRequest(message) {
    return /\b(cancel|cancellation)\b.*\b(appointment|appointments)\b/i.test(message) ||
           /\b(cancel|cancellation)\s+my\s+appointment\b/i.test(message);
}

function extractAppointmentId(message) {
    const match = String(message || "").match(/\b(?:appointment\s*(?:id|number|no\.?)?\s*[:#-]?\s*)?(\d+)\b/i);
    return match ? Number(match[1]) : null;
}

async function handleAppointmentCancellation(message) {
    const text = String(message || "").trim();

    // Start cancellation only when the user explicitly requests it.
    if (isAppointmentCancellationRequest(text)) {
        const id = extractAppointmentId(text);

        if (id && id > 0) {
            cancellationState = {
                step: "confirm",
                appointmentId: id
            };

            return `You requested cancellation of appointment ID ${id}. Should I cancel this appointment? Please say Yes or No.`;
        }

        cancellationState = {
            step: "appointment_id",
            appointmentId: null
        };

        return "Please tell me the appointment ID you want to cancel.";
    }

    if (!cancellationState.step) {
        return null;
    }

    // Allow the user to abandon the cancellation flow.
    if (/^(no|nope|stop|never mind|don't cancel|do not cancel)$/i.test(text)) {
        cancellationState = { step: null, appointmentId: null };
        return "Okay, I have not cancelled the appointment.";
    }

    if (cancellationState.step === "appointment_id") {
        const id = extractAppointmentId(text);

        if (!id || id < 1) {
            return "I couldn't identify a valid appointment ID. Please enter the numeric appointment ID.";
        }

        cancellationState = {
            step: "confirm",
            appointmentId: id
        };

        return `You requested cancellation of appointment ID ${id}. Should I cancel this appointment? Please say Yes or No.`;
    }

    if (cancellationState.step === "confirm") {
        if (!/^(yes|yes please|confirm|confirm cancellation|correct|yeah|yep|yeah|yep|sure|ok|okay)$/i.test(text)) {
            return "Please reply Yes to confirm cancellation, or No to keep the appointment.";
        }

        const appointmentId = cancellationState.appointmentId;

        // Clear state before the API call to prevent accidental repeat requests.
        cancellationState = { step: null, appointmentId: null };

        try {
            const result = await postJson(
                `/api/booking/cancel/${appointmentId}`,
                {}
            );

            if (result.success) {
                return `Appointment cancelled successfully. Appointment ID: ${result.appointment_id}. Status: ${result.status}.`;
            }

            return result.message || "The appointment cancellation could not be confirmed.";
        } catch (error) {
            console.error("Appointment cancellation failed:", error);

            return `I couldn't cancel appointment ID ${appointmentId}. The server reported: ${error.message}`;
        }
    }

    return null;
}

async function getBookingReply(message) {
    const text = String(message || "").trim();

    // Handle existing booking cancellation without creating an appointment.
    if (/^(cancel|cancel booking|stop booking|never mind)$/i.test(text)) {
        if (bookingState.active) {
            resetBooking();
            return "Booking cancelled. No appointment was created.";
        }
    }

    // Handle appointment cancellation before the booking flow.
    const cancellationReply = await handleAppointmentCancellation(text);

    if (cancellationReply !== null) {
        return cancellationReply;
    }

    if (!bookingState.active) {
        if (!isBookingRequest(text)) {
            return null;
        }

        createBookingForm();

        return "Please complete the appointment form below. We will check availability only in your selected department.";
    }

    if (bookingState.step === "form") {
        return "Please complete the appointment form displayed above.";
    }

    if (bookingState.step === "checking") {
        return "Availability is being checked. Please wait.";
    }

    if (bookingState.step === "slot") {
        return "Please select one of the displayed slots.";
    }

    if (bookingState.step === "confirm") {
        return "Please use Confirm Booking or Cancel on the appointment card.";
    }

    return null;
}

function addBookingConfirmationCard() {
    if (bookingState.step !== "confirm" || !bookingState.selected) {
        return;
    }

    if ($("bookingConfirmationCard")) {
        return;
    }

    const slot = bookingState.selected;

    if (
        String(slot.specialty || "").trim().toLowerCase() !==
        bookingState.specialty.trim().toLowerCase()
    ) {
        resetBooking();

        addMessage(
            "assistant",
            "The selected slot does not match your department. Please start again."
        );

        return;
    }

    const card = document.createElement("div");
    card.id = "bookingConfirmationCard";
    card.className = "message assistant";

    const content = document.createElement("div");
    content.className = "message-content";
    content.style.whiteSpace = "pre-line";

    content.textContent =
        `Confirm Appointment\n\n` +
        `Patient: ${bookingState.patientName}\n` +
        `Phone: ${bookingState.phone}\n` +
        `Department: ${slot.specialty}\n` +
        `Doctor: ${slot.doctor_name}\n` +
        `Date: ${slot.date}\n` +
        `Time: ${slot.time}\n\n` +
        "The appointment has not been booked yet.";

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "send-button";
    confirmButton.textContent = "Confirm Booking";
    confirmButton.style.marginTop = "12px";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.style.margin = "12px 0 0 8px";

    confirmButton.addEventListener("click", async () => {
        if (confirmButton.disabled) return;

        confirmButton.disabled = true;
        cancelButton.disabled = true;

        setStatus("Confirming appointment...");

        try {
            const result = await postJson("/api/booking/confirm", {
                patient_name: bookingState.patientName,
                phone: bookingState.phone,
                doctor_id: slot.doctor_id,
                slot_id: slot.slot_id,
                confirmed: true
            });

            const appointment = result.appointment;

            if (!appointment) {
                throw new Error("Booking response did not include appointment details.");
            }

            // Keep the success card visible while resetting booking state.
            content.textContent =
                `Appointment booked successfully!\n\n` +
                `Appointment ID: ${appointment.appointment_id}\n` +
                `Patient: ${appointment.patient_name}\n` +
                `Doctor: ${appointment.doctor_name}\n` +
                `Department: ${appointment.specialty}\n` +
                `Date: ${appointment.date}\n` +
                `Time: ${appointment.time}\n` +
                `Status: ${appointment.status}`;

            confirmButton.remove();
            cancelButton.remove();

            // Remove other booking cards without removing the success card.
            $("bookingFormCard")?.remove();
            $("bookingSlotOptions")?.remove();

            bookingState = {
                active: false,
                step: null,
                specialty: "",
                appointmentDate: "",
                requestedTime: "",
                suggestions: [],
                selected: null,
                patientName: "",
                phone: ""
            };

            setStatus("Appointment booked successfully.");
        } catch (error) {
            console.error("Booking confirmation failed:", error);

            content.textContent =
                "Booking could not be confirmed. The slot may no longer " +
                "be available. Please start a new booking.";

            confirmButton.remove();
            cancelButton.remove();

            $("bookingFormCard")?.remove();
            $("bookingSlotOptions")?.remove();

            bookingState = {
                active: false,
                step: null,
                specialty: "",
                appointmentDate: "",
                requestedTime: "",
                suggestions: [],
                selected: null,
                patientName: "",
                phone: ""
            };

            setStatus("Booking failed. Please check availability again.");
        }
    });

    cancelButton.addEventListener("click", () => {
        resetBooking();
        card.remove();

        addMessage(
            "assistant",
            "Booking cancelled. No appointment was created."
        );

        setStatus("Booking cancelled.");
    });

    card.append(content, confirmButton, cancelButton);
    $("conversation")?.appendChild(card);

    const conversation = $("conversation");
    if (conversation) {
        conversation.scrollTop = conversation.scrollHeight;
    }
}

// -------------------- AI RESPONSE --------------------

async function getAIResponse(message) {
    const bookingReply = await getBookingReply(message);

    if (bookingReply !== null) {
        return {
            reply: bookingReply,
            backendSeconds: 0
        };
    }

    const data = await postJson("/api/chat", { message });

    if (!data.reply) {
        throw new Error("The AI returned an empty response.");
    }

    return {
        reply: data.reply,
        backendSeconds: Number(data.backend_seconds || 0)
    };
}

// -------------------- TIMING / METADATA --------------------

function seconds(startedAt) {
    return (performance.now() - startedAt) / 1000;
}

function createTimingPayload(
    method,
    userInput,
    aiResponse,
    totalLatency,
    audio = {},
    aiResponseTime = totalLatency,
    aiBackendTime = 0,
    extra = {}
) {
    return {
        method,
        user_input: userInput,
        ai_response: aiResponse,
        timings: {
            total_latency_seconds: totalLatency,
            total_time_seconds: totalLatency,
            response_latency_seconds: totalLatency,
            ai_response_time_seconds: aiResponseTime,
            ai_backend_time_seconds: aiBackendTime,
            ...extra,
            ...audio
        }
    };
}

function addTimingDetails(data) {
    const conversation = $("conversation");
    if (!conversation) return;

    const assistants = conversation.querySelectorAll(".message.assistant");
    const target = assistants[assistants.length - 1];

    if (!target) return;

    target.querySelector(".timing-details")?.remove();

    const timings = data.timings || {};

    const panel = document.createElement("div");
    panel.className = "timing-details";

    panel.style.cssText =
        "margin-top:10px;padding:10px;border-radius:10px;" +
        "background:rgba(127,127,127,0.10);font-size:12px;" +
        "line-height:1.8;white-space:pre-line;";

    const fmt = (key, digits = 2) =>
        `${Number(timings[key] || 0).toFixed(digits)} sec`;

    const lines = [
        `Method: ${data.method}`,
        `AI Response Time: ${fmt("ai_response_time_seconds")}`,
        `AI Backend Time: ${fmt("ai_backend_time_seconds")}`
    ];

    if (
        data.method === "Speech-to-Text" ||
        data.method === "Speech-to-Speech"
    ) {
        lines.push(
            `Recording Time: ${fmt("recording_time_seconds")}`,
            `Transcription Time: ${fmt("transcription_time_seconds")}`
        );
    }

    if (
        data.method === "Text-to-Speech" ||
        data.method === "Speech-to-Speech"
    ) {
        lines.push(
            `Voice Generation Time: ${fmt("voice_generation_time_seconds")}`,
            `Audio Download Time: ${fmt("audio_download_time_seconds", 3)}`
        );
    }

    lines.push(`TOTAL LATENCY: ${fmt("total_latency_seconds")}`);

    panel.textContent = lines.join("\n");
    target.appendChild(panel);
}

async function writeTimingSummary(data) {
    const timing = data.timings || {};

    const fmt = (key, digits = 2) =>
        `${Number(timing[key] || 0).toFixed(digits)} seconds`;

    const lines = [
        "=".repeat(50),
        "TIMING SUMMARY",
        `Method: ${data.method}`,
        `User Input: ${data.user_input}`,
        `AI Response: ${data.ai_response}`,
        "",
        `AI Response Time: ${fmt("ai_response_time_seconds")}`,
        `AI Backend Time: ${fmt("ai_backend_time_seconds")}`
    ];

    if (
        data.method === "Speech-to-Text" ||
        data.method === "Speech-to-Speech"
    ) {
        lines.push(
            `Recording Time: ${fmt("recording_time_seconds")}`,
            `Transcription Time: ${fmt("transcription_time_seconds")}`
        );
    }

    if (
        data.method === "Text-to-Speech" ||
        data.method === "Speech-to-Speech"
    ) {
        lines.push(
            `Voice Generation Time: ${fmt("voice_generation_time_seconds")}`,
            `Audio Download Time: ${fmt("audio_download_time_seconds", 3)}`,
            `Audio Duration: ${fmt("audio_duration_seconds")}`
        );
    }

    lines.push(
        "",
        `TOTAL LATENCY: ${fmt("total_latency_seconds")}`,
        "=".repeat(50)
    );

    console.log(lines.join("\n"));

    addTimingDetails(data);

    try {
        await postJson("/api/metadata-log", data);
    } catch (error) {
        console.error("Could not save timing summary:", error);
    }
}

// -------------------- TTT --------------------

async function sendMessage(text) {
    const input = $("tttInput");

    if (!input && text == null) return;

    const messageText = (text ?? input.value).trim();

    if (!messageText) {
        setStatus("Please type a message first.");
        return;
    }

    const button = $("sendButton");
    if (button?.disabled) return;

    const started = performance.now();

    if (input) input.value = "";

    addMessage("user", messageText);
    setStatus("AI is thinking...");

    if (button) button.disabled = true;

    try {
        const aiStarted = performance.now();
        const aiResult = await getAIResponse(messageText);
        const aiClientSeconds = seconds(aiStarted);

        addMessage("assistant", aiResult.reply);
        await waitForScreenUpdate();

        const totalLatency = seconds(started);

        const timingData = createTimingPayload(
            methodNames.ttt,
            messageText,
            aiResult.reply,
            totalLatency,
            {},
            aiClientSeconds,
            aiResult.backendSeconds
        );

        await writeTimingSummary(timingData);

        setStatus(
            `AI response received in ${totalLatency.toFixed(2)} seconds.`
        );
    } catch (error) {
        console.error("TTT error:", error);
        setStatus("Could not get an AI response. Please try again.");
    } finally {
        if (button) button.disabled = false;
    }
}

// -------------------- AUDIO PLAYBACK / TTS --------------------

function playAudioBlob(blob) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);

    currentAudio = audio;

    const cleanup = () => {
        URL.revokeObjectURL(audioUrl);

        if (currentAudio === audio) {
            currentAudio = null;
        }
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });

    audio.play().catch((error) => {
        cleanup();
        console.error("Audio playback failed:", error);
    });

    return { audio };
}

async function responseToAudio(text) {
    const requestStarted = performance.now();

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
        throw new Error(
            `TTS error ${response.status}: ${await response.text()}`
        );
    }

    const backendSeconds = Number(
        response.headers.get("X-TTS-Backend-Seconds") || 0
    );

    // Fallback for browsers that do not support MPEG MediaSource streaming.
    if (
        !window.MediaSource ||
        !MediaSource.isTypeSupported("audio/mpeg") ||
        !response.body
    ) {
        const blob = await response.blob();

        if (!blob.size) {
            throw new Error("The generated audio is empty.");
        }

        const downloadSeconds = Math.max(
            0,
            seconds(requestStarted) - backendSeconds
        );

        const playback = playAudioBlob(blob);

        const audioDuration = await new Promise((resolve) => {
            const audio = playback.audio;

            if (audio.readyState >= 1) {
                resolve(
                    Number.isFinite(audio.duration) ? audio.duration : 0
                );
                return;
            }

            audio.addEventListener(
                "loadedmetadata",
                () => {
                    resolve(
                        Number.isFinite(audio.duration) ? audio.duration : 0
                    );
                },
                { once: true }
            );

            audio.addEventListener("error", () => resolve(0), {
                once: true
            });
        });

        return {
            voice_generation_time_seconds: backendSeconds,
            audio_download_time_seconds: downloadSeconds,
            audio_duration_seconds: audioDuration
        };
    }

    const mediaSource = new MediaSource();
    const audioUrl = URL.createObjectURL(mediaSource);
    const audio = new Audio();

    audio.preload = "auto";
    audio.src = audioUrl;
    currentAudio = audio;

    let cleanedUp = false;
    let firstChunkSeconds = 0;
    let playbackStarted = false;

    const cleanup = () => {
        if (cleanedUp) return;

        cleanedUp = true;
        URL.revokeObjectURL(audioUrl);

        if (currentAudio === audio) {
            currentAudio = null;
        }
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });

    try {
        await new Promise((resolve, reject) => {
            mediaSource.addEventListener("sourceopen", resolve, {
                once: true
            });

            mediaSource.addEventListener(
                "error",
                () => reject(
                    new Error("Could not initialize audio streaming.")
                ),
                { once: true }
            );
        });

        const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
        const reader = response.body.getReader();

        async function appendChunk(chunk) {
            await new Promise((resolve, reject) => {
                const onUpdateEnd = () => {
                    cleanupListeners();
                    resolve();
                };

                const onError = () => {
                    cleanupListeners();
                    reject(new Error("Could not process an audio chunk."));
                };

                const cleanupListeners = () => {
                    sourceBuffer.removeEventListener(
                        "updateend",
                        onUpdateEnd
                    );
                    sourceBuffer.removeEventListener("error", onError);
                };

                sourceBuffer.addEventListener("updateend", onUpdateEnd);
                sourceBuffer.addEventListener("error", onError);

                try {
                    sourceBuffer.appendBuffer(chunk);
                } catch (error) {
                    cleanupListeners();
                    reject(error);
                }
            });
        }

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;
            if (!value || value.byteLength === 0) continue;

            if (firstChunkSeconds === 0) {
                firstChunkSeconds = seconds(requestStarted);
            }

            await appendChunk(value);

            if (!playbackStarted) {
                playbackStarted = true;

                audio.play().catch((error) => {
                    console.error("Audio playback failed:", error);
                });
            }
        }

        if (!playbackStarted) {
            throw new Error("The generated audio stream was empty.");
        }

        if (mediaSource.readyState === "open") {
            mediaSource.endOfStream();
        }

        const audioDuration = await new Promise((resolve) => {
            const readDuration = () => {
                if (audio.readyState >= 1 && Number.isFinite(audio.duration)) {
                    resolve(audio.duration);
                    return true;
                }

                return false;
            };

            if (readDuration()) return;

            const onMetadata = () => {
                if (readDuration()) {
                    clearTimeout(timeoutId);
                    audio.removeEventListener("loadedmetadata", onMetadata);
                    audio.removeEventListener("durationchange", onMetadata);
                }
            };

            const timeoutId = setTimeout(() => {
                audio.removeEventListener("loadedmetadata", onMetadata);
                audio.removeEventListener("durationchange", onMetadata);
                resolve(0);
            }, 2000);

            audio.addEventListener("loadedmetadata", onMetadata);
            audio.addEventListener("durationchange", onMetadata);
            onMetadata();
        });

        return {
            voice_generation_time_seconds: firstChunkSeconds,
            audio_download_time_seconds: Math.max(
                0,
                seconds(requestStarted) - firstChunkSeconds
            ),
            audio_duration_seconds: audioDuration
        };
    } catch (error) {
        audio.pause();
        cleanup();
        throw error;
    }
}

async function speakText() {
    const input = $("ttsInput");
    if (!input) return;

    const text = input.value.trim();

    if (!text) {
        setStatus("Please type your question first.");
        input.focus();
        return;
    }

    const button = $("speakButton");
    if (button?.disabled) return;

    const started = performance.now();

    input.value = "";

    if (button) button.disabled = true;

    addMessage("user", text);
    setStatus("Generating AI text response...");

    try {
        const aiStarted = performance.now();
        const aiResult = await getAIResponse(text);
        const aiClientSeconds = seconds(aiStarted);

        addMessage("assistant", aiResult.reply);
        await waitForScreenUpdate();

        setStatus("Generating voice...");

        const audioMetrics = await responseToAudio(aiResult.reply);
        const totalLatency = seconds(started);

        const timingData = createTimingPayload(
            methodNames.tts,
            text,
            aiResult.reply,
            totalLatency,
            audioMetrics,
            aiClientSeconds,
            aiResult.backendSeconds
        );

        await writeTimingSummary(timingData);

        setStatus(`AI audio ready in ${totalLatency.toFixed(2)} seconds.`);
    } catch (error) {
        console.error("TTS error:", error);
        setStatus("AI response or audio generation failed. Please try again.");
    } finally {
        if (button) button.disabled = false;
    }
}

// -------------------- STT / STS TRANSCRIPT CONTROLS --------------------

function ensureTranscriptControls(mode) {
    const panel = $(mode === "stt" ? "sttPanel" : "stsPanel");

    if (!panel) {
        console.error("Transcript panel not found:", mode);
        return;
    }

    const prefix = mode === "stt" ? "stt" : "sts";
    const textareaId = `${prefix}TranscriptInput`;
    const buttonId = `${prefix}SendButton`;

    let textarea = $(textareaId);

    if (!textarea) {
        textarea = document.createElement("textarea");
        textarea.id = textareaId;
        textarea.rows = 3;
        textarea.placeholder =
            "Your transcript will appear here. Review or edit it.";
        textarea.setAttribute("aria-label", "Review transcript");
        textarea.style.width = "100%";
        textarea.style.marginTop = "12px";

        panel.appendChild(textarea);
    }

    let button = $(buttonId);

    if (!button) {
        button = document.createElement("button");
        button.id = buttonId;
        button.type = "button";
        button.className = "send-button";
        button.textContent = mode === "stt" ? "Send to AI" : "Send & Speak";
        button.style.marginTop = "10px";

        panel.appendChild(button);
    }

    if (button.dataset.handlerAttached !== "true") {
        button.dataset.handlerAttached = "true";

        button.addEventListener("click", () => {
            submitTranscriptFromInput(mode, textareaId, buttonId);
        });
    }

    if (textarea.dataset.enterHandlerAttached !== "true") {
        textarea.dataset.enterHandlerAttached = "true";

        textarea.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitTranscriptFromInput(mode, textareaId, buttonId);
            }
        });
    }
}

function submitTranscriptFromInput(mode, textareaId, buttonId) {
    const textarea = $(textareaId);
    const button = $(buttonId);
    const text = textarea?.value.trim();

    if (!text) {
        setStatus("Transcript is empty. Please speak again.");
        return;
    }

    if (button?.disabled) return;

    console.log(`[${mode.toUpperCase()}] Sending transcript to AI:`, text);

    submitConfirmedTranscript(text, mode === "sts");
}

// -------------------- MICROPHONE RECORDING --------------------

async function startRecording(mode) {
    if (isRecording) return;

    if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Microphone requires localhost or HTTPS.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        audioChunks = [];
        recordingMode = mode;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

        mediaRecorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);

        const recorder = mediaRecorder;

        recorder.ondataavailable = (event) => {
            if (event.data?.size > 0) {
                audioChunks.push(event.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(audioChunks, {
                type: recorder.mimeType || "audio/webm"
            });

            stream.getTracks().forEach((track) => track.stop());

            if (speechTiming[mode]?.startedAt != null) {
                speechTiming[mode].recording_time_seconds =
                    seconds(speechTiming[mode].startedAt);
            }

            isRecording = false;
            updateRecordingUI(mode, false);

            if (!blob.size) {
                setStatus("No audio captured. Please try again.");
                return;
            }

            await transcribeAudio(blob, mode);
        };

        speechTiming[mode] = {
            startedAt: performance.now(),
            recording_time_seconds: 0,
            transcription_time_seconds: 0,
            transcription_backend_seconds: 0
        };

        recorder.start();

        isRecording = true;
        updateRecordingUI(mode, true);

        setStatus("Recording... tap the microphone again to stop.");
    } catch (error) {
        console.error("Recording error:", error);
        setStatus("Microphone permission denied or unavailable.");
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
    }
}

function toggleRecording(mode) {
    if (isRecording) {
        if (recordingMode === mode) {
            stopRecording();
        }

        return;
    }

    startRecording(mode);
}

function updateRecordingUI(mode, recording) {
    const button = $(
        mode === "stt" ? "sttRecordButton" : "stsRecordButton"
    );

    const heading = $(
        mode === "stt" ? "sttVoiceTitle" : "stsVoiceTitle"
    );

    const wave = $(
        mode === "stt" ? "sttWave" : "stsWave"
    );

    if (button) {
        button.classList.toggle("recording", recording);
        button.setAttribute("aria-pressed", String(recording));
    }

    if (heading) {
        heading.textContent = recording
            ? "Recording... tap to stop"
            : mode === "stt"
                ? "Tap the mic to start"
                : "Tap to talk to your AI";
    }

    wave?.classList.toggle("active", recording);
}

// -------------------- STT TRANSCRIPTION --------------------

async function transcribeAudio(blob, mode) {
    const transcriptionStarted = performance.now();

    setStatus("Converting speech to text...");

    try {
        const formData = new FormData();

        formData.append("audio", blob, "recording.webm");

        const response = await fetch("/api/stt", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(
                `STT error ${response.status}: ${await response.text()}`
            );
        }

        const data = await response.json();
        const transcript = (data.text || "").trim();
        const previous = speechTiming[mode] || {};

        speechTiming[mode] = {
            ...previous,
            transcription_time_seconds: seconds(transcriptionStarted),
            transcription_backend_seconds: Number(data.backend_seconds || 0)
        };

        if (!transcript) {
            setStatus("No speech detected. Please try again.");
            return;
        }

        ensureTranscriptControls(mode);

        const textarea = $(
            mode === "stt"
                ? "sttTranscriptInput"
                : "stsTranscriptInput"
        );

        if (!textarea) {
            throw new Error(`Transcript textarea not found for ${mode}.`);
        }

        textarea.value = transcript;
        textarea.focus();

        setStatus(
            "Transcript ready. Press Enter or click the send button to continue."
        );

        console.log(`[${mode.toUpperCase()}] Transcript ready:`, transcript);
    } catch (error) {
        console.error("Transcription error:", error);
        setStatus("Speech transcription failed. Please try again.");
    }
}

// -------------------- CONFIRMED STT / STS --------------------

async function submitConfirmedTranscript(text, speakReply) {
    const mode = speakReply ? "sts" : "stt";

    const button = $(
        speakReply ? "stsSendButton" : "sttSendButton"
    );

    if (button?.disabled) return;

    const confirmedStarted = performance.now();

    addMessage("user", text);
    setStatus("AI is preparing a response...");

    if (button) button.disabled = true;

    try {
        const aiStarted = performance.now();
        const aiResult = await getAIResponse(text);
        const aiClientSeconds = seconds(aiStarted);

        addMessage("assistant", aiResult.reply);
        await waitForScreenUpdate();

        let audioMetrics = {};

        if (speakReply) {
            setStatus("Generating voice...");
            audioMetrics = await responseToAudio(aiResult.reply);
        }

        const confirmedToReadySeconds = seconds(confirmedStarted);
        const speech = speechTiming[mode] || {};

        const recordingSeconds = Number(
            speech.recording_time_seconds || 0
        );

        const transcriptionSeconds = Number(
            speech.transcription_time_seconds || 0
        );

        const totalLatency =
            recordingSeconds +
            transcriptionSeconds +
            confirmedToReadySeconds;

        const extra = {
            recording_time_seconds: recordingSeconds,
            transcription_time_seconds: transcriptionSeconds,
            transcription_backend_time_seconds: Number(
                speech.transcription_backend_seconds || 0
            ),
            confirmed_to_ready_seconds: confirmedToReadySeconds
        };

        const timingData = createTimingPayload(
            methodNames[mode],
            text,
            aiResult.reply,
            totalLatency,
            audioMetrics,
            aiClientSeconds,
            aiResult.backendSeconds,
            extra
        );

        await writeTimingSummary(timingData);

        setStatus(
            speakReply
                ? `Speech-to-speech response ready in ${totalLatency.toFixed(2)} seconds.`
                : `Speech-to-text and AI response completed in ${totalLatency.toFixed(2)} seconds.`
        );

        speechTiming[mode] = null;
    } catch (error) {
        console.error(`${mode.toUpperCase()} error:`, error);
        setStatus("Could not complete the AI response. Please try again.");
    } finally {
        if (button) button.disabled = false;
    }
}

// -------------------- EVENT LISTENERS --------------------

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".mode-card").forEach((button) => {
        button.addEventListener("click", () => {
            showMode(button.dataset.mode);
        });
    });

    if ($("sendButton")) {
        $("sendButton").addEventListener("click", () => sendMessage());
    }

    if ($("tttInput")) {
        $("tttInput").addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    if ($("speakButton")) {
        $("speakButton").addEventListener("click", speakText);
    }

    if ($("sttRecordButton")) {
        $("sttRecordButton").addEventListener("click", () => {
            toggleRecording("stt");
        });
    }

    if ($("stsRecordButton")) {
        $("stsRecordButton").addEventListener("click", () => {
            toggleRecording("sts");
        });
    }

    ensureTranscriptControls("stt");
    ensureTranscriptControls("sts");

    document.querySelectorAll(".suggestion").forEach((button) => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.prompt;

            if (currentMode === "tts") {
                if ($("ttsInput")) {
                    $("ttsInput").value = prompt;
                    $("ttsInput").focus();
                }
            } else {
                showMode("ttt");

                if ($("tttInput")) {
                    $("tttInput").value = prompt;
                    $("tttInput").focus();
                }
            }
        });
    });

    showMode("ttt");
});

// Support HTML onclick handlers.
window.showMode = showMode;
window.sendMessage = sendMessage;
window.speakText = speakText;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.toggleRecording = toggleRecording;