import 'dotenv/config';
import { createForm } from '../src/services/googleFormsService.js';

async function main() {
  const title = `Test Form ${new Date().toISOString()}`;
  const documentTitle = title;

  const created = await createForm({ title, documentTitle });

  console.log('Created Google Form');
  console.log('formId:', created.formId);
  console.log('editUrl:', created.editUrl);
  console.log('viewUrl:', created.viewUrl);
  if (created.responderUri) console.log('responderUri:', created.responderUri);
}

main().catch((err) => {
  console.error('TEST FAILED');
  console.error('message:', err?.message);
  console.error('status:', err?.response?.status);
  console.error('data:', err?.response?.data);
  process.exit(1);
});
