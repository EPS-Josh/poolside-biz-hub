const SmsNotifications = () => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px', lineHeight: '1.5' }}>
      <h1>SMS Service Notifications</h1>

      <p>
        Finest Pools &amp; Spas offers optional SMS text notifications so you can stay informed
        about your scheduled pool cleaning and repair services.
      </p>

      <h2>What You Are Signing Up For</h2>
      <p>
        By providing your mobile number and consenting below, you agree to receive
        <strong> non-marketing, service-related text messages</strong> from Finest Pools &amp; Spas,
        including:
      </p>
      <ul>
        <li>Appointment reminders</li>
        <li>Notifications that your pool service technician is on the way</li>
        <li>Updates or changes related to your scheduled service</li>
      </ul>

      <p>
        We do <strong>not</strong> send promotional or marketing texts to this list.
      </p>

      <h2>Message Frequency &amp; Rates</h2>
      <p>
        Message frequency varies based on your scheduled services (typically a few messages per month).
        Message and data rates may apply. Check with your mobile carrier for details.
      </p>

      <h2>Manage Your Subscription</h2>
      <p>
        You can opt out of SMS notifications at any time:
      </p>
      <ul>
        <li>Reply <strong>STOP</strong> to any message to unsubscribe.</li>
        <li>Reply <strong>HELP</strong> for help or more information.</li>
      </ul>

      <h2>Sign Up for SMS Notifications</h2>
      <p>
        To sign up, provide your mobile number to Finest Pools &amp; Spas during scheduling
        (online or with our office) and confirm that you agree to receive SMS service notifications.
      </p>

      <form action="#" method="post" style={{ marginTop: '10px' }}>
        <label htmlFor="phone"><strong>Mobile Phone Number</strong></label><br />
        <input
          type="tel"
          id="phone"
          name="phone"
          placeholder="(555) 555-5555"
          style={{ padding: '8px', width: '100%', maxWidth: '300px', margin: '5px 0' }}
        /><br />

        <label>
          <input type="checkbox" name="sms_consent" required />
          {' '}I agree to receive non-marketing service-related SMS notifications from
          Finest Pools &amp; Spas. I understand that I can reply STOP to opt out,
          and message/data rates may apply.
        </label><br /><br />

        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Submit
        </button>
      </form>

      <h2>Policies</h2>
      <p>
        For more information, please see our:
      </p>
      <ul>
        <li><a href="https://poolside.fps-tucson.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
        <li><a href="https://poolside.fps-tucson.com/eula" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a></li>
      </ul>

      <p style={{ marginTop: '40px', fontSize: '0.9em', color: '#666' }}>
        Finest Pools &amp; Spas &mdash; Tucson, AZ
      </p>
    </div>
  );
};

export default SmsNotifications;
