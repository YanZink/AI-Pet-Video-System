const Keyboards = require('../utils/keyboards');

class TelegramPaymentService {
  constructor(bot) {
    this.bot = bot;
    // Telegram Stars doesn't require providerToken!
  }

  // Create payment invoice for Telegram Stars
  createPaymentInvoice(requestId, photoCount, script, lang = 'en') {
    const priceStars = parseInt(process.env.VIDEO_PRICE_STARS) || 1000;

    // Use English titles for Telegram (required)
    const title = 'AI Pet Video Creation';
    const description = `Create AI video with ${photoCount} photo${
      photoCount > 1 ? 's' : ''
    }`;

    console.log('📦 Creating Telegram Stars invoice:', {
      title,
      description,
      priceStars,
      requestId,
    });

    return {
      title: title,
      description: description,
      payload: JSON.stringify({
        requestId,
        type: 'video_creation',
        timestamp: Date.now(),
      }),
      currency: 'XTR',
      prices: [
        {
          label: 'Video Creation',
          amount: priceStars, // Stars amount
        },
      ],
    };
  }

  // Send payment invoice to user
  async sendInvoice(chatId, requestId, photoCount, script, lang = 'en') {
    try {
      const invoice = this.createPaymentInvoice(
        requestId,
        photoCount,
        script,
        lang
      );

      console.log('📤 Sending Telegram Stars invoice:', {
        chatId,
        title: invoice.title,
        description: invoice.description,
        currency: invoice.currency,
        amount: invoice.prices[0].amount,
      });

      // CRITICAL: Validate required parameters
      if (!invoice.title || typeof invoice.title !== 'string') {
        throw new Error('Invoice title is required and must be a string');
      }

      if (!invoice.description || typeof invoice.description !== 'string') {
        throw new Error('Invoice description is required and must be a string');
      }

      if (!invoice.currency || !invoice.prices) {
        throw new Error('Currency and prices are required');
      }

      console.log('🔍 Final invoice data:', {
        title: invoice.title,
        description: invoice.description,
        payload: invoice.payload,
        currency: invoice.currency,
        prices: invoice.prices,
      });

      // IMPORTANT: In Telegram, sendInvoice works via callApi with an object! This differs from the official Telegram Bot API
      const result = await this.bot.telegram.callApi('sendInvoice', {
        chat_id: chatId,
        title: invoice.title,
        description: invoice.description,
        payload: invoice.payload,
        provider_token: '',
        currency: invoice.currency,
        prices: invoice.prices,
        photo_url:
          'https://via.placeholder.com/300/4A90E2/FFFFFF?text=AI+Pet+Video',
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        is_flexible: false,
      });

      console.log('✅ Invoice sent successfully');

      return { success: true };
    } catch (error) {
      console.error('💳 Telegram Stars invoice error:', error.message);
      console.error('Full error details:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Validate payment data
  validatePayment(paymentData) {
    try {
      const payload = JSON.parse(paymentData.invoice_payload);

      // Check if payment is not too old (1 hour)
      const paymentAge = Date.now() - payload.timestamp;
      if (paymentAge > 3600000) {
        return {
          valid: false,
          error: 'Payment payload expired',
        };
      }

      return {
        valid: true,
        requestId: payload.requestId,
        type: payload.type,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid payment payload',
      };
    }
  }
}

module.exports = TelegramPaymentService;
