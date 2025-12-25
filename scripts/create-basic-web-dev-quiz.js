import 'dotenv/config';
import { createQuizForm } from '../src/services/googleFormsService.js';

async function main() {
  const created = await createQuizForm({
    title: 'Basic Web Development Quiz',
    description: 'This quiz is designed to test basic knowledge of web development concepts.',
    questions: [
      {
        id: 'html_stands_for',
        title: 'What does HTML stand for?',
        choices: [
          'Hyper Text Markup Language',
          'High Text Machine Language',
          'Hyperlinks and Text Markup Language',
          'Home Tool Markup Language'
        ],
        correctAnswer: 'Hyper Text Markup Language'
      },
      {
        id: 'styling_language',
        title: 'Which language is primarily used for styling web pages?',
        choices: ['HTML', 'JavaScript', 'CSS', 'Python'],
        correctAnswer: 'CSS'
      },
      {
        id: 'js_framework',
        title: 'Which of the following is a JavaScript framework?',
        choices: ['React', 'Django', 'Flask', 'Laravel'],
        correctAnswer: 'React'
      }
    ]
  });

  console.log('Created quiz form');
  console.log('formId:', created.formId);
  console.log('editUrl:', created.editUrl);
  console.log('viewUrl:', created.viewUrl);
  if (created.responderUri) console.log('responderUri:', created.responderUri);
}

main().catch((err) => {
  console.error('FAILED');
  console.error('message:', err?.message);
  console.error('status:', err?.response?.status);
  console.error('data:', err?.response?.data);
  process.exit(1);
});
