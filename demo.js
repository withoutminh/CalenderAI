const chatBody = document.getElementById('chat-body');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

const API_KEY = "AIzaSyA0hX7B057TPp1GNC4ITjndgIHrUJHwPuA"; // API Thay ở đây
const MODEL = "gemini-1.5-flash";

async function generateText(prompt) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                }),
            }
        );
        console.log("Response status:", response.status);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API lỗi:", errorData);
            return `Xin lỗi, tôi gặp lỗi khi kết nối với API: ${response.status} - ${errorData.error.message}`;
        }

        const data = await response.json();
        console.log("API response data:", data);

        if (
            data &&
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0]
        ) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log("generateText response:", aiResponse);

            if (aiResponse !== "") {
                return aiResponse;
            } else {
                return "Tôi không hiểu ý bạn. Bạn có thể diễn đạt lại không?";
            }
        } else {
            console.error("API Lỗi");
            return "Xin lỗi, tôi gặp sự cố khi kết nối với API.";
        }
    } catch (error) {
        console.error("Lỗi:", error.message);
        return "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn.";
    }
}

function addMessageToChat(message, sender) {
    console.log("Calling addMessageToChat with:", message, sender);
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'ai' ? 'ai-message' : 'user-message');
    messageElement.innerHTML = `<p>${message}</p>`;
    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight; // Cuộn xuống cuối
}

let currentAction = null; // Flag để theo dõi hành động hiện tại
let currentSubject = null;
let currentGrade = null;
let currentLessonOrTopicNumber = null;

// Hàm xử lý yêu cầu từ user
async function handleUserInput() {
    const userMessage = userInput.value;
    addMessageToChat(userMessage, 'user');
    userInput.value = ''; // Xóa nội dung ô input
  
    if (userMessage.toLowerCase() === "thoát") {
      console.log("Thoát.");
      return; // Thoát khỏi hàm nếu người dùng nhập "thoát"
    }
  
    if (currentAction === null) {
      await analyzeUserInput(userMessage);
    } else {
      // Xử lý các bước tiếp theo dựa trên currentAction
      switch (currentAction) {
        case 'askingForGrade':
          handleGradeInput(userMessage);
          break;
        case 'askingForLessonNumber':
          handleLessonNumberInput(userMessage);
          break;
        case 'askingForTopicNumber':
          handleTopicNumberInput(userMessage);
          break;
        case 'askingForTime':
          handleTimeInput(userMessage);
          break;
      }
    }
  }

sendButton.addEventListener('click', handleUserInput);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const userMessage = userInput.value;

        switch (currentAction) {
            case 'askingForGrade':
                handleGradeInput(userMessage);
                break;
            case 'askingForLessonNumber':
                handleLessonNumberInput(userMessage);
                break;
            case 'askingForTopicNumber':
                handleTopicNumberInput(userMessage);
                break;
            case 'askingForTime':
                handleTimeInput(userMessage);
                break;
            case 'askingForRelicName':
                handleRelicNameInput(userMessage);
                break;
            case 'askingForQuizSubject':
                handleQuizSubjectInput(userMessage);
                break;
            default:
                handleUserInput(); // Xử lý input ban đầu
                break;
        }
        userInput.value = "";
    }
});

function displayErrorMessage(message) {
    addMessageToChat(message, 'ai');
}

async function displayAIMessage(message) {
    addMessageToChat(message, 'ai');
}

async function askQuestion(question) {
    displayAIMessage(question);

    return new Promise((resolve) => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const userMessage = userInput.value;
                userInput.value = '';
                userInput.removeEventListener('keydown', handleKeyDown);
                resolve(userMessage);
            }
        };

        userInput.addEventListener('keydown', handleKeyDown);
    });
}

async function askForTimeAndSchedule(timePrompt, action, subject, lessonOrTopicNumber = "") {
    displayAIMessage(timePrompt);

    const timeInput = await new Promise((resolve) => {
        const handleTempInput = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const userMessage = userInput.value;
                userInput.value = '';
                userInput.removeEventListener('keydown', handleTempInput);
                resolve(userMessage);
            }
        };

        userInput.addEventListener('keydown', handleTempInput);
    });

    let detail = ""; // Biến để lưu thông tin bài học/chủ đề (nếu có)
    if (action === "Làm Quiz") {
        const lessonOrTopicNumber = await askQuestion(`Bạn muốn làm Quiz ${subject} bài/chủ đề số mấy?`);
        detail = ` bài/chủ đề ${lessonOrTopicNumber}`;
    }

    const parsedDateTime = parseDateTime(timeInput);
    if (parsedDateTime) {
        const calendarUrl = createGoogleCalendarUrl(action, subject + detail, parsedDateTime);
        window.open(calendarUrl, '_blank');
        displayAIMessage(`[LOG] Google Calendar đã được mở cho ${subject} ${detail}`);
    } else {
        displayErrorMessage("[LOG] Không hiểu định dạng ngày giờ. Hãy thử lại.");
    }
}



// Sửa các hàm handleStudyRequest, handlePracticeRequest, handleFlashcardRequest, handleQuizRequest
// để hiển thị thông báo lỗi lên giao diện HTML thay vì console.error
async function handleStudyRequest(subject, grade, lessonOrTopicNumber = null) {
    if (subject === "Lịch Sử") {
      if (!lessonOrTopicNumber) {
        currentAction = 'askingForLessonNumber';
        displayAIMessage("Bạn muốn học Lịch Sử bài số mấy? ");
      } else {
        currentLessonOrTopicNumber = lessonOrTopicNumber;
        currentAction = 'askingForTime';
        displayAIMessage(`Nhập thời gian cho việc học Lịch Sử bài ${lessonOrTopicNumber}`);
      }
    } else if (subject === "Giáo dục địa phương") {
      if (!lessonOrTopicNumber) {
        currentAction = 'askingForTopicNumber';
        displayAIMessage("Bạn muốn học Giáo dục địa phương chủ đề mấy? ");
      } else {
        currentLessonOrTopicNumber = lessonOrTopicNumber;
        currentAction = 'askingForTime';
        displayAIMessage(`Nhập thời gian cho việc học Giáo dục địa phương chủ đề ${lessonOrTopicNumber}`);
      }
    } else if (subject === "Lịch sử" || subject === "Sử" || subject === "Giáo dục địa phương" || subject === "GDĐP") {
        currentAction = 'askingForTime';
        displayAIMessage(`Nhập thời gian cho việc học ${subject}`);
    }
  }

  async function handlePracticeRequest(subject, grade, lessonOrTopicNumber = null) {
    if (subject === "Lịch Sử") {
        if (!lessonOrTopicNumber) {
            currentAction = 'askingForLessonNumber';
            displayAIMessage("Bạn muốn luyện tập Lịch Sử bài số mấy? ");
        } else {
            currentLessonOrTopicNumber = lessonOrTopicNumber;
            currentAction = 'askingForTime';
            displayAIMessage(`Nhập thời gian cho việc luyện tập Lịch Sử bài ${lessonOrTopicNumber}`);
        }
    } else if (subject === "Giáo dục địa phương") {
        if (!lessonOrTopicNumber) {
            currentAction = 'askingForTopicNumber';
            displayAIMessage("Bạn muốn luyện tập Giáo dục địa phương chủ đề mấy? ");
        } else {
            currentLessonOrTopicNumber = lessonOrTopicNumber;
            currentAction = 'askingForTime';
            displayAIMessage(`Nhập thời gian cho việc luyện tập Giáo dục địa phương chủ đề ${lessonOrTopicNumber}`);
        }
    } else if (subject === "Lịch sử" || subject === "Giáo dục địa phương" || subject === "Sử" || subject === "GDĐP") {
        currentAction = 'askingForTime';
        displayAIMessage(`Nhập thời gian cho việc luyện tập ${subject}`);
    } else {
        displayErrorMessage("[Lỗi] Không nhận diện được môn học.");
        currentAction = null;
    }
}

async function handleFlashcardRequest(relicName) {
    if (!relicName) {
        displayErrorMessage("[Lỗi] Không nhận được tên di tích.");
        currentAction = null;
        return;
    }
    const timePrompt = `Nhập thời gian cho việc xem Flashcard di tích ${relicName}`;
    await askForTimeAndSchedule(
        timePrompt,
        "Xem Flashcard",
        `di tích ${relicName}`
    );
    currentAction = null; // Reset action sau khi hoàn thành
}

async function handleQuizRequest(quizSubjectInput) {
    const { subject, grade } = await extractSubjectAndGrade(quizSubjectInput);

    if (!subject) {
        displayErrorMessage("Không tìm thấy môn học cho Quiz. Hãy thử lại.");
        currentAction = null;
        return;
    }

    if (!grade) {
        displayErrorMessage("Vui lòng nhập lớp học (10, 11, hoặc 12).");
        currentAction = null;
        return;
    }

    if (grade < 10) {
        displayErrorMessage(`Hiện tại chưa có tài liệu cho lớp ${grade}. Vui lòng chọn lớp 10, 11 hoặc 12.`);
        currentAction = null;
        return;
    }

    currentSubject = subject;
    currentGrade = grade;

    if (subject === "Lịch Sử") {
        currentAction = 'askingForTime';
        displayAIMessage(`Nhập thời gian cho việc làm Quiz Lịch Sử lớp ${grade} (Nhập số bài)`);
    } else if (subject === "Giáo dục địa phương") {
        currentAction = 'askingForTime';
        displayAIMessage(`Nhập thời gian cho việc làm Quiz Giáo dục địa phương lớp ${grade} (Nhập số chủ đề)`);
    } else {
        displayErrorMessage("Môn học này không hỗ trợ làm Quiz. Hãy thử lại.");
        currentAction = null;
    }
}

async function handleGradeInput(userInput) {
    addMessageToChat(userInput, 'user');
    const grade = parseInt(userInput);
    if (isNaN(grade) || grade < 10 || grade > 12) {
      displayErrorMessage(`Vui lòng nhập lớp học hợp lệ (10, 11, hoặc 12).`);
    } else {
      currentGrade = grade;
      if (currentAction === 'askingForGrade') {
            if (currentSubject === 'Lịch Sử') {
                await handleStudyRequest(currentSubject, currentGrade);
            } else if (currentSubject === 'Giáo dục địa phương') {
                await handleStudyRequest(currentSubject, currentGrade);
            } else if (currentSubject === 'Lịch sử' || currentSubject === 'Sử') {
                await handleStudyRequest('Lịch Sử', currentGrade);
            } else if (currentSubject === 'Giáo dục địa phương' || currentSubject === 'GDĐP') {
                await handleStudyRequest('Giáo dục địa phương', currentGrade);
            } else if (currentAction === 'askingForGrade' && currentSubject) {
                // Xử lý cho trường hợp 'luyện tập'
                if (currentSubject === 'Lịch Sử') {
                    await handlePracticeRequest(currentSubject, currentGrade);
                } else if (currentSubject === 'Giáo dục địa phương') {
                    await handlePracticeRequest(currentSubject, currentGrade);
                } else if (currentSubject === 'Lịch sử' || currentSubject === 'Sử') {
                    await handlePracticeRequest('Lịch Sử', currentGrade);
                } else if (currentSubject === 'Giáo dục địa phương' || currentSubject === 'GDĐP') {
                    await handlePracticeRequest('Giáo dục địa phương', currentGrade);
                }
            }
        }
    }
  }

  async function handleLessonNumberInput(userInput) {
    addMessageToChat(userInput, 'user');
    const lessonNumber = parseInt(userInput);
    if (isNaN(lessonNumber)) {
      displayErrorMessage("Vui lòng nhập số bài học hợp lệ.");
    } else {
      currentLessonOrTopicNumber = lessonNumber;
      currentAction = 'askingForTime';
      displayAIMessage(`Nhập thời gian cho việc ${currentSubject === "Lịch Sử" ? "học" : "luyện tập"} Lịch Sử bài ${lessonNumber}`);
    }
  }

  async function handleTopicNumberInput(userInput) {
    addMessageToChat(userInput, 'user');
    const topicNumber = parseInt(userInput);
    if (isNaN(topicNumber)) {
      displayErrorMessage("Vui lòng nhập số chủ đề hợp lệ.");
    } else {
      currentLessonOrTopicNumber = topicNumber;
      currentAction = 'askingForTime';
      displayAIMessage(`Nhập thời gian cho việc ${currentSubject === "Giáo dục địa phương" ? "học" : "luyện tập"} Giáo dục địa phương chủ đề ${topicNumber}`);
    }
  }
  async function handleRelicNameInput(userInput) {
    addMessageToChat(userInput, 'user');
      const relicName = userInput;
      if (!relicName) {
          displayErrorMessage("Vui lòng nhập tên di tích hợp lệ.");
      } else {
          await handleFlashcardRequest(relicName);
      }
  }
  
  async function handleQuizSubjectInput(userInput) {
      addMessageToChat(userInput, 'user');
      const quizSubject = extractQuizSubject(userInput);
      if (!quizSubject) {
          displayErrorMessage("Vui lòng nhập môn học hợp lệ (Lịch Sử hoặc Giáo dục địa phương).");
      } else {
          currentSubject = quizSubject;
          currentAction = 'askingForGrade';
          displayAIMessage("Vui lòng nhập lớp học:");
      }
  }
  
  async function handleTimeInput(userInput) {
    addMessageToChat(userInput, 'user'); 
    const parsedDateTime = parseDateTime(userInput);
    if (parsedDateTime) {
        let detail = "";
        if (currentAction === 'askingForTime' && (currentSubject === "Lịch Sử" || currentSubject === "Giáo dục địa phương")) {
            if (currentAction === 'askingForTime' && currentSubject === "Lịch Sử") {
                detail = ` bài ${currentLessonOrTopicNumber}`;
            } else if (currentAction === 'askingForTime' && currentSubject === "Giáo dục địa phương") {
                detail = ` chủ đề ${currentLessonOrTopicNumber}`;
            }
        }
        
        let actionText = "";
        if (currentAction.includes('học')) {
            actionText = "Học";
        } else if (currentAction.includes('luyện tập')) {
            actionText = "Luyện tập";
        } else if (currentAction.includes('quiz')) {
            actionText = "Làm Quiz";
        } else if (currentAction.includes('flashcard')) {
            actionText = "Xem Flashcard";
        }
        
        const calendarUrl = createGoogleCalendarUrl(
            actionText,
            `${currentSubject}${detail}`,
            parsedDateTime
        );

        window.open(calendarUrl, '_blank');
        displayAIMessage(`Đã mở Google Calender, hãy bấm "Lưu" vào lịch nhé`);
        currentAction = null; // Reset action sau khi hoàn thành
        currentSubject = null;
        currentGrade = null;
        currentLessonOrTopicNumber = null;

    } else {
        displayErrorMessage("[LOG] Không hiểu định dạng ngày giờ. Hãy thử lại.");
    }
}

async function analyzeUserInput(userInput) {
    const lowerCaseInput = userInput.toLowerCase();
  
    if (lowerCaseInput.includes("học")) {
      currentAction = 'askingForSubjectAndGrade';
      let { subject, grade } = await extractSubjectAndGrade(userInput, "học");
      if (!subject) {
        currentAction = null;
        return;
      }
      currentSubject = subject;
  
      if (!grade) {
        currentAction = 'askingForGrade';
        displayAIMessage("Vui lòng nhập lớp học:");
        // Không cần await ở đây vì listener 'keydown' sẽ xử lý
      } else {
        currentGrade = grade;
        await handleStudyRequest(currentSubject, currentGrade);
      }
    } else if (lowerCaseInput.includes("làm quiz")) {
          currentAction = 'askingForQuizSubject';
          if (!lowerCaseInput.includes("lịch sử") && !lowerCaseInput.includes("giáo dục địa phương")) {
              const quizSubjectPrompt = `Bạn muốn làm Quiz về môn gì? (Lịch Sử hay Giáo dục Địa phương)`;
              displayAIMessage(quizSubjectPrompt);
          } else {
              await handleQuizRequest(userInput);
          }
      } else if (lowerCaseInput.includes("luyện tập")) {
          currentAction = 'askingForSubjectAndGrade';
          let { subject, grade } = await extractSubjectAndGrade(userInput, "luyện tập");
          if (!subject) {
              currentAction = null;
              return;
          }
          currentSubject = subject;
  
          if (!grade) {
              currentAction = 'askingForGrade';
              displayAIMessage("Vui lòng nhập lớp học:");
          } else {
              currentGrade = grade;
              await handlePracticeRequest(currentSubject, currentGrade);
          }
      } else if (lowerCaseInput.includes("xem flashcard")) {
          currentAction = 'askingForRelicName';
          displayAIMessage("Bạn muốn xem Flashcard về di tích nào? ");
      }
  }
  
  

// Hàm trích xuất môn học và lớp từ phản hồi của user
async function extractSubjectAndGrade(userResponse, action) {
    const subjects = ["Lịch Sử", "Giáo dục địa phương", "Sử", "GDĐP"];
    const lowerCaseResponse = userResponse.toLowerCase();
    let subject, grade;

    for (const subj of subjects) {
        if (lowerCaseResponse.includes(subj.toLowerCase())) {
            subject = subj;
            break;
        }
    }
    const match = lowerCaseResponse.match(/lớp (\d{1,2})/);
    if (match) {
        grade = parseInt(match[1], 10);
    }

    if (subject && grade) {
        return { subject, grade };
    } else if (!subject) {
        displayErrorMessage("Không tìm thấy môn học. Hãy thử lại.");
        return { subject: null, grade: null };
    } else {
        return { subject, grade: null };
    }
}
// Hàm xử lý yêu cầu làm Quiz
async function handleQuizRequest(quizSubjectInput) {
  console.log("Current userInput in handleQuizRequest:", userInput.value);
  const { subject, grade } = await extractSubjectAndGrade(quizSubjectInput);

  if (!subject) {
      displayErrorMessage("Không tìm thấy môn học cho Quiz. Hãy thử lại.");
      return;
  }

  if (!grade) {
      displayErrorMessage("Vui lòng nhập lớp học (10, 11, hoặc 12).");
      return;
  }

  if (grade < 10) {
      displayErrorMessage(
          `Hiện tại chưa có tài liệu cho lớp ${grade}. Vui lòng chọn lớp 10, 11 hoặc 12.`
      );
      return;
  }

  if (subject === "Lịch Sử") {
      const timePrompt = `Nhập thời gian cho việc làm Quiz Lịch Sử lớp ${grade} (Nhập số bài)`;
      await askForTimeAndSchedule(
          timePrompt,
          "Làm Quiz",
          `Lịch Sử lớp ${grade}`
      );
  } else if (subject === "Giáo dục địa phương") {
      const timePrompt = `Nhập thời gian cho việc làm Quiz Giáo dục địa phương lớp ${grade} (Nhập số chủ đề)`;
      await askForTimeAndSchedule(
          timePrompt,
          "Làm Quiz",
          `Giáo dục địa phương lớp ${grade}`
      );
  } else {
      displayErrorMessage("Môn học này không hỗ trợ làm Quiz. Hãy thử lại.");
  }
}

function extractQuizSubject(userResponse) {
  const subjects = ["Lịch Sử", "Giáo dục địa phương", "Sử", "GDĐP"];
  const lowerCaseResponse = userResponse.toLowerCase();

  for (const subject of subjects) {
      if (lowerCaseResponse.includes(subject.toLowerCase())) {
          return subject;
      }
  }

  return null;
}
// Phân tích thời gian của user nhập vào
function parseDateTime(dateTimeString) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let hours = 0;
  let minutes = 0;
  let isTimeSet = false;

  dateTimeString = dateTimeString
    .toLowerCase()
    .replace("giờ", "")
    .replace("sáng", "am")
    .replace("chiều", "pm")
    .replace("trưa", "pm")
    .replace("tối", "pm")
    .replace("khuya", "am");

  if (dateTimeString.includes("mai")) {
    day += 1;
  } else if (dateTimeString.includes("mốt")) {
    day += 2;
  } else if (dateTimeString.includes("nay")) {
    day = now.getDate();
  } else if (dateTimeString.includes("tuần sau")) {
    day += 7;
  } else if (dateTimeString.includes("tháng sau")) {
    month += 1;
  }

  const weekdays = [
    "thứ hai",
    "thứ ba",
    "thứ tư",
    "thứ năm",
    "thứ sáu",
    "thứ bảy",
    "chủ nhật",
  ];
  for (let i = 0; i < weekdays.length; i++) {
    if (dateTimeString.includes(weekdays[i])) {
      let currentDayOfWeek = now.getDay();
      let targetDayOfWeek = i;
      let daysToAdd = targetDayOfWeek - currentDayOfWeek;

      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }

      day += daysToAdd;
      break;
    }
  }

  let match = dateTimeString.match(/(\d{1,2}):(\d{2})(am|pm)?/i);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toLowerCase() : null;

    if (ampm === "pm" && hours < 12) {
      hours += 12;
    }
    if (ampm === "am" && hours === 12) {
      hours = 0;
    }
    isTimeSet = true;
  } else {
    let hourMatch = dateTimeString.match(/(\d{1,2})(am|pm)/i);
    if (hourMatch) {
      hours = parseInt(hourMatch[1], 10);
      const ampm = hourMatch[2] ? hourMatch[2].toLowerCase() : null;

      if (dateTimeString.includes("mai")) {
        if (ampm === "am") {
        } else if (ampm === "pm" && hours < 12) {
        } else if (ampm === "pm" && hours == 12) {
          hours = 12
        }
      } else {
        if (ampm === "pm" && hours < 12) {
          hours += 12;
        }
        if (ampm === "am" && hours === 12) {
          hours = 0;
        }
      }

      isTimeSet = true;
    } else {
        let singleHourMatch = dateTimeString.match(/(\d{1,2})/i);
        if (singleHourMatch) {
            hours = parseInt(singleHourMatch[1], 10);
            if (!dateTimeString.includes("am") && !dateTimeString.includes("pm")) {
                if (dateTimeString.includes("mai")) {
                    if (hours < 12) {
                    } else {
                        hours += 12;
                    }
                } else {
                    const currentHour = now.getHours();
                    if (hours < 12) {
                        if (currentHour >= 12) {
                            hours += 12;
                        }
                    }
                }
            }
            isTimeSet = true;
        }
    }
  }

  if (!isTimeSet) {
    if (dateTimeString.includes("chiều") || dateTimeString.includes("trưa")) {
      hours = 14; 
      minutes = 0;
    } else if (dateTimeString.includes("tối")) {
      hours = 19;
      minutes = 0;
    } else if (dateTimeString.includes("khuya")) {
      hours = 2; 
      minutes = 0;
    } else if (dateTimeString.includes("sáng")) {
      hours = 8;
      minutes = 0;
    }
  }

  let dateMatch = dateTimeString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    day = parseInt(dateMatch[1], 10);
    month = parseInt(dateMatch[2], 10) - 1;
    year = parseInt(dateMatch[3], 10);
  } else {
    dateMatch = dateTimeString.match(/(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      day = parseInt(dateMatch[1], 10);
      month = parseInt(dateMatch[2], 10) - 1;
    }
  }

  const startDate = new Date(Date.UTC(year, month, day, hours - 7, minutes));
  const endDate = new Date(Date.UTC(year, month, day, hours - 7 + 1, minutes));

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    displayErrorMessage(
      "Không thể phân tích thời gian. Hãy sử dụng định dạng HH:MM AM/PM, HH:MM 24h, hoặc các cụm từ như 'ngày mai', 'tuần sau'."
    );
    return null;
  }

  return { startDate, endDate };
}

function formatDateForUrl(date) {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// URL cho Google Calendar
function createGoogleCalendarUrl(action, subject, { startDate, endDate }) {
  const formattedStartDate = formatDateForUrl(startDate);
  const formattedEndDate = formatDateForUrl(endDate);

  let text = "";
  if (action === "Học") {
      text = "Học " + subject;
  } else if (action === "Làm Quiz") {
      text = "Làm Quiz " + subject;
  } else if (action === "Luyện tập") {
      text = "Luyện tập " + subject;
  } else {
      text = "Xem " + subject;
  }

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      text
  )}&dates=${formattedStartDate}/${formattedEndDate}`;
  return url;
}

// Lời chào ban đầu từ AI
async function initialGreeting() {
  const initialPrompt = `
      Bạn là một trợ lý ảo hỗ trợ người dùng lên lịch cho các hoạt động trong ngày.
      Hãy bắt đầu bằng cách hỏi người dùng: "Hôm nay bạn muốn làm gì?. Không được phép hỏi câu khác hay thêm
      chi tiết vào cho câu hỏi"
  `;
  const initialResponse = await generateText(initialPrompt);
  if (initialResponse) {
      addMessageToChat(initialResponse, 'ai');
  } else {
      addMessageToChat("Hôm nay bạn muốn làm gì?", 'ai');
  }
}

// lời chào của AI
initialGreeting();


