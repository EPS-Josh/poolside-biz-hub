import { Header } from "@/components/Header";

const SmsOptInProof = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1>Proof of SMS Opt-In</h1>

          <p>
            This page describes how Finest Pools &amp; Spas collects customer consent to receive
            <strong> non-marketing, service-related SMS notifications</strong> and provides
            examples of the messages we send.
          </p>

          <h2>Business &amp; Use Case Overview</h2>
          <p>
            Finest Pools &amp; Spas provides residential pool cleaning and repair services. We use our
            toll-free number solely to send operational SMS messages, such as:
          </p>
          <ul>
            <li>Appointment reminders</li>
            <li>Notifications that a pool service technician is on the way</li>
            <li>Updates related to scheduled service (e.g., delays or rescheduling)</li>
          </ul>
          <p>
            We do <strong>not</strong> send any marketing or promotional content on this toll-free number.
          </p>

          <h2>How Customers Opt In</h2>

          <h3>1. Web / Online Scheduling</h3>
          <p>
            When customers schedule service through our website or customer portal, they provide their
            mobile phone number and are shown clear language describing SMS service notifications.
            The customer must actively consent before SMS is enabled on their account.
          </p>

          <p><strong>Example consent language shown during scheduling:</strong></p>
          <blockquote className="border-l-4 border-border pl-4 text-muted-foreground italic">
            By providing your mobile number, you agree to receive non-marketing, service-related text messages
            from Finest Pools &amp; Spas about your scheduled pool service (appointment reminders and technician
            arrival notifications). Message and data rates may apply. Reply STOP to opt out, HELP for help.
          </blockquote>

          <h3>2. SMS Keyword Confirmation</h3>
          <p>
            In some cases, after capturing consent during scheduling, we send a confirmation message asking
            the customer to reply with a keyword (Y, YES, or OK) to confirm their subscription to SMS
            notifications.
          </p>

          <p><strong>Sample opt-in confirmation message:</strong></p>
          <blockquote className="border-l-4 border-border pl-4 text-muted-foreground italic">
            Finest Pools &amp; Spas: You are subscribed to receive text updates about your pool service
            appointments. Reply Y, YES, or OK to confirm. Message &amp; data rates may apply. Reply STOP to
            opt out, HELP for help.
          </blockquote>

          <p>
            We store the customer&apos;s consent status in our system once they respond with Y, YES, or OK.
          </p>

          <h2>Opt-Out and Help Instructions</h2>
          <p>
            All messages we send include clear opt-out and help instructions. Customers can:
          </p>
          <ul>
            <li>Reply <strong>STOP</strong> to unsubscribe from SMS notifications.</li>
            <li>Reply <strong>HELP</strong> to receive additional information.</li>
          </ul>

          <p><strong>Sample help message:</strong></p>
          <blockquote className="border-l-4 border-border pl-4 text-muted-foreground italic">
            Finest Pools &amp; Spas: For help with your service notifications, visit
            https://www.finestpoolsandspas.com or reply STOP to opt out. Message &amp; data rates may apply.
          </blockquote>

          <h2>Sample Messages Sent to Customers</h2>

          <p><strong>Technician on the way:</strong></p>
          <blockquote className="border-l-4 border-border pl-4 text-muted-foreground italic">
            Finest Pools &amp; Spas: Your pool service technician is on the way for your scheduled service.
            Reply STOP to opt out or HELP for help.
          </blockquote>

          <p><strong>Appointment reminder:</strong></p>
          <blockquote className="border-l-4 border-border pl-4 text-muted-foreground italic">
            Finest Pools &amp; Spas: Reminder – your pool service appointment is scheduled for tomorrow.
            Reply STOP to opt out or HELP for help.
          </blockquote>

          <h2>Policies</h2>
          <p>
            Our Privacy Policy and Terms &amp; Conditions are publicly available here:
          </p>
          <ul>
            <li><a href="https://poolside.fps-tucson.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            <li><a href="https://poolside.fps-tucson.com/eula" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a></li>
          </ul>

          <h2>Contact</h2>
          <p>
            For any questions regarding this SMS program, contact:
          </p>
          <p>
            Finest Pools &amp; Spas<br />
            Email: <a href="mailto:joshua@finestpoolsandspas.com">joshua@finestpoolsandspas.com</a>
          </p>

          <p className="text-sm text-muted-foreground mt-10">
            This page is provided as documentation for messaging providers and reviewers to verify our
            opt-in and messaging practices.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SmsOptInProof;
