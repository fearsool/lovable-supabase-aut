import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.ETSY_API_KEY;
const oauthToken = process.env.ETSY_OAUTH_TOKEN;

const getActiveListings = async () => {
  try {
    const response = await axios.get(
      'https://api.etsy.com/v3/application/listings?state=active',
      {
        headers: {
          'x-api-key': apiKey,
          'Authorization': `Bearer ${oauthToken}`
        }
      }
    );
    console.log('AKTİF ÜRÜNLER:', response.data);
  } catch (error) {
    console.error('API HATASI:', error.response?.data || error.message);
  }
};

getActiveListings();
