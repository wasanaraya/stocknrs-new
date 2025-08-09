const emailjs = require('@emailjs/nodejs');

const serviceID = 'service_f2t090t';
const templateID = 'template_7xibgbq';
const publicKey = 'MK2OUomFmzWPrHpMW';
const privateKey = 'lPoC2DE7kGh2uVp7sEWHH';

const templateParams = {
  requester: 'ระบบทดสอบ',
  approver_name: 'วิทย์',
  approver_email: 'sorawitt@gmail.com',
  cc_emails: '',
  account_name: 'บัญชีทดสอบ',
  amount: '0.00',
  items_table: '<p>(ไม่มีรายการวัสดุที่ระบุ)</p>',
  note: '-',
  approve_url: 'https://example.com/approval?request_id=TEST&decision=APPROVE',
  reject_url: 'https://example.com/approval?request_id=TEST&decision=REJECT'
};

(async () => {
  try {
    // Initialize with both public and private keys
    emailjs.init({ publicKey, privateKey });
    const response = await emailjs.send(serviceID, templateID, templateParams);
    console.log('EmailJS response:', response);
  } catch (error) {
    console.error('Error sending email:', error);
    if (error && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
})();
