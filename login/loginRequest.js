const axios = require('axios');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const { saveTokenToFile } = require('./sessionHandler');

const config = {
  imap: {
    user: 'eliasbogan80@gmail.com',
    password: 'apshccsjqjdudieg',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000
  }
};

async function sendOtpRequest() {
  const url = 'https://oddsjam.com/api/backend/auth/send-otp';
  const payload = {
    email: "eliasbogan80@gmail.com",
    brand: "oddsjam"
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('OTP sent:', response.data);

    const { time, userwatchToken } = response.data;

    const waitTime = 5000;

    console.log(`Waiting for ${waitTime / 1000} seconds to retrieve the OTP...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    const otpCode = await getOtpFromEmail();
    
    if (otpCode) {
      console.log('Submitting OTP:', otpCode);
      await submitOtp(otpCode, time, userwatchToken);
    } else {
      console.log('Failed to retrieve OTP from email.');
    }
  } catch (error) {
    console.error('Error sending OTP:', error.response ? error.response.data : error.message);
  }
}

async function getOtpFromEmail() {
  try {
    const connection = await imaps.connect({ imap: config.imap });

    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN', ['FROM', 'auth@oddsjam.com']];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    if (messages.length === 0) {
      console.log('No new emails found from OddsJam.');
      return null;
    }

    const latestEmail = messages[messages.length - 1];
    let emailBody = '';
    latestEmail.parts.forEach(part => {
      if (part.which === 'TEXT') {
        emailBody = part.body;
      }
    });

    const parsedEmail = await simpleParser(emailBody);
    const otpMatch = parsedEmail.text.match(/\b\d{6}\b/);

    connection.end();

    if (otpMatch) {
      console.log('OTP found:', otpMatch[0]);
      return otpMatch[0];
    } else {
      console.log('OTP not found in email.');
      return null;
    }

  } catch (error) {
    console.error('Error fetching OTP:', error);
    return null;
  }
}

async function submitOtp(otp, time, userwatchToken) {
  const url = 'https://oddsjam.com/api/backend/auth/check-otp';
  const payload = {
    email: "eliasbogan80@gmail.com",
    brand: "oddsjam",
    otp: otp,
    time: time,
    redirect: "https://oddsjam.com/",
    userwatchToken: userwatchToken
  };

  const timestamp = Math.floor(Date.now() / 1000);

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Timestamp': timestamp.toString(),
      },
      withCredentials: true
    });

    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const accessTokenCookie = cookies.find(cookie => cookie.startsWith('access_token='));
      const accessToken = accessTokenCookie ? accessTokenCookie.split(';')[0] : null;

      if (accessToken) {
        console.log('Access Token:', accessToken);
        saveTokenToFile(accessToken);
        return accessToken;
      } else {
        console.log('Access token not found in cookies.');
        return null;
      }
    } else {
      console.log('No cookies found in the response headers.');
      return null;
    }

  } catch (error) {
    console.log(error);
    console.error('Error submitting OTP:', error.response ? error.response.data : error.message);
    return null;
  }
}

module.exports = { sendOtpRequest };
