import React, { useState } from 'react';
import { ComplaintTicket, User } from '../types';
import { OFFICIAL_SUPPORT_PHONE, OFFICIAL_SUPPORT_WHATSAPP } from '../data/mockData';
import { 
  Phone, 
  MessageCircle, 
  HelpCircle, 
  AlertOctagon, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  UserX,
  LogIn,
  UploadCloud,
  FileText
} from 'lucide-react';

interface SupportSectionProps {
  currentUser: User | null;
  complaints: ComplaintTicket[];
  onSubmitComplaint: (newComplaint: Partial<ComplaintTicket>) => Promise<void>;
  prefillComplaint?: { category: string; targetListingTitle?: string; sellerName?: string } | null;
}

export const SupportSection: React.FC<SupportSectionProps> = ({
  currentUser,
  complaints,
  onSubmitComplaint,
  prefillComplaint,
}) => {
  const [activeTab, setActiveTab] = useState<'help' | 'ticket' | 'my-tickets'>(
    prefillComplaint ? 'ticket' : 'help'
  );

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-scam');

  // Ticket Form State
  const [category, setCategory] = useState<ComplaintTicket['category']>(
    (prefillComplaint?.category as ComplaintTicket['category']) || 'Scam / Fraud Report'
  );
  const [title, setTitle] = useState(
    prefillComplaint?.targetListingTitle ? `Report regarding listing: ${prefillComplaint.targetListingTitle}` : ''
  );
  const [description, setDescription] = useState(
    prefillComplaint?.sellerName ? `Seller involved: ${prefillComplaint.sellerName}\n` : ''
  );
  const [userNameInput, setUserNameInput] = useState(currentUser?.name || '');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '');
  const [accusedSeller, setAccusedSeller] = useState(prefillComplaint?.sellerName || '');
  const [ticketSuccessId, setTicketSuccessId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter complaints by current user
  const userComplaints = complaints.filter(
    (c) => (currentUser && c.userId === currentUser.id) || (userPhone && c.userPhone === userPhone)
  );

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !userPhone.trim()) return;

    setSubmitting(true);
    try {
      const newTicket: Partial<ComplaintTicket> = {
        userId: currentUser?.id || 'guest',
        userName: currentUser?.name || userNameInput.trim() || 'Mini Campus Student',
        userPhone: userPhone.trim(),
        category,
        title: title.trim(),
        description: description.trim(),
        accusedSellerName: accusedSeller.trim() || undefined,
        status: 'Open',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      await onSubmitComplaint(newTicket);
      const generatedId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
      setTicketSuccessId(generatedId);
      
      // Clear form
      setTitle('');
      setDescription('');
      setAccusedSeller('');
    } catch (err: any) {
      alert('Failed to submit ticket: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppSupport = (topic: string = 'Campus Marketplace Assistance') => {
    const userRoleText = currentUser ? ` (${currentUser.role})` : '';
    const nameText = currentUser?.name || userNameInput || 'University of Ilorin Mini Campus Student';
    const text = `Hello C'IO Support (University of Ilorin Mini Campus Marketplace), I need assistance with: ${topic}. My Name: ${nameText}${userRoleText}.`;
    window.open(`https://wa.me/${OFFICIAL_SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Top Banner with Phone Number and WhatsApp */}
      <div className="rounded-3xl bg-[#2D2D2A] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-[#5A5A40]/30">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#5A5A40]/40 text-[#E8E8DF] text-xs font-semibold mb-3 border border-[#5A5A40]/50">
            <ShieldCheck className="h-4 w-4 text-[#E8E8DF]" />
            C'IO — University of Ilorin Mini Campus Marketplace
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Customer Support & Safety Desk
          </h1>
          <p className="text-sm text-[#E0E0D5] mt-2 max-w-xl leading-relaxed">
            Need help with your account, student matric verification, product upload, or suspect a scam? 
            Our dedicated team is ready to assist you.
          </p>

          {/* Prominently Displayed Phone Number & WhatsApp CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
              <div className="w-10 h-10 rounded-xl bg-[#5A5A40] flex items-center justify-center text-white shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] text-[#E0E0D5]/70 uppercase tracking-wider block font-medium">
                  Official Support Phone:
                </span>
                <a
                  href={`tel:${OFFICIAL_SUPPORT_PHONE}`}
                  className="text-base sm:text-lg font-mono font-bold text-white hover:text-[#E8E8DF] transition"
                >
                  {OFFICIAL_SUPPORT_PHONE}
                </a>
              </div>
            </div>

            <button
              id="support-whatsapp-cta-btn"
              onClick={() => handleWhatsAppSupport('General Support Query')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1fa951] text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-lg transition active:scale-[0.99]"
            >
              <MessageCircle className="h-5 w-5 fill-current" />
              <span>Chat with Support on WhatsApp</span>
              <ExternalLink className="h-4 w-4 opacity-75" />
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#5A5A40]/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-[#E0E0D5] pb-3">
        <button
          id="support-tab-help"
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            activeTab === 'help'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help Guides & FAQs</span>
        </button>

        <button
          id="support-tab-ticket"
          onClick={() => setActiveTab('ticket')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            activeTab === 'ticket'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <AlertOctagon className="h-4 w-4" />
          <span>Report an Issue / Scam</span>
        </button>

        <button
          id="support-tab-my-tickets"
          onClick={() => setActiveTab('my-tickets')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
            activeTab === 'my-tickets'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>My Reported Tickets ({userComplaints.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Help Center Tab */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Quick Scenario 1: Can't Register */}
              <div 
                onClick={() => setExpandedFaq('faq-register')}
                className="p-4 rounded-3xl bg-white border border-[#E0E0D5] hover:border-[#5A5A40] cursor-pointer shadow-xs transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E8E8DF] text-[#5A5A40] flex items-center justify-center mb-2.5">
                  <UserX className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-serif font-bold text-[#2D2D2A]">Can&apos;t Register or Verify Matric?</h3>
                <p className="text-xs text-[#7A7A6A] mt-1">
                  How matric verification works and format guidelines.
                </p>
              </div>

              {/* Quick Scenario 2: Can't Log In */}
              <div 
                onClick={() => setExpandedFaq('faq-login')}
                className="p-4 rounded-3xl bg-white border border-[#E0E0D5] hover:border-[#5A5A40] cursor-pointer shadow-xs transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E8E8DF] text-[#5A5A40] flex items-center justify-center mb-2.5">
                  <LogIn className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-serif font-bold text-[#2D2D2A]">Can&apos;t Log In?</h3>
                <p className="text-xs text-[#7A7A6A] mt-1">
                  Troubleshoot phone session issues or password credentials.
                </p>
              </div>

              {/* Quick Scenario 3: Can't Upload Products */}
              <div 
                onClick={() => setExpandedFaq('faq-upload')}
                className="p-4 rounded-3xl bg-white border border-[#E0E0D5] hover:border-[#5A5A40] cursor-pointer shadow-xs transition"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E8E8DF] text-[#5A5A40] flex items-center justify-center mb-2.5">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-serif font-bold text-[#2D2D2A]">Can&apos;t Upload Products?</h3>
                <p className="text-xs text-[#7A7A6A] mt-1">
                  Guidelines on images, pricing, and Mini Campus locations.
                </p>
              </div>

              {/* Quick Scenario 4: Issues with Orders or Scams */}
              <div 
                onClick={() => setExpandedFaq('faq-scam')}
                className="p-4 rounded-3xl bg-white border border-[#E0E0D5] hover:border-[#5A5A40] cursor-pointer shadow-xs transition"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2.5">
                  <AlertOctagon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-serif font-bold text-[#2D2D2A]">Issues with Orders or Scams?</h3>
                <p className="text-xs text-[#7A7A6A] mt-1">
                  Report fraudulent sellers & learn safe Mini Campus meetup zones.
                </p>
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {/* FAQ 1: Can't Register */}
              <div className="rounded-3xl bg-white border border-[#E0E0D5] overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === 'faq-register' ? null : 'faq-register')}
                  className="w-full flex items-center justify-between p-4 text-left font-serif font-bold text-sm text-[#2D2D2A] hover:bg-[#F5F5F0] transition"
                >
                  <span className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-[#5A5A40]" />
                    How do I register as a student and get the Verified Matric Badge?
                  </span>
                  {expandedFaq === 'faq-register' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedFaq === 'faq-register' && (
                  <div className="p-4 pt-0 text-xs text-[#2D2D2A] border-t border-[#E0E0D5] bg-[#F5F5F0]/60 space-y-2">
                    <p>
                      1. Click <strong>&quot;Register&quot;</strong> in the top menu or on the login modal.
                    </p>
                    <p>
                      2. Select <strong>Student</strong> as your account type.
                    </p>
                    <p>
                      3. Enter your valid Unilorin Matriculation Number (e.g. <code>21/55EC102</code>).
                    </p>
                    <p>
                      4. Once registered, the admin verifies your matric number from the Admin Console to award the green <strong>&quot;Matric Verified&quot;</strong> badge.
                    </p>
                    <button
                      onClick={() => handleWhatsAppSupport('Matric Registration Verification Help')}
                      className="inline-flex items-center gap-1 text-[#5A5A40] font-semibold hover:underline mt-1"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Contact WhatsApp Support for Fast-Track Matric Verification</span>
                    </button>
                  </div>
                )}
              </div>

              {/* FAQ 2: Can't Log In */}
              <div className="rounded-3xl bg-white border border-[#E0E0D5] overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === 'faq-login' ? null : 'faq-login')}
                  className="w-full flex items-center justify-between p-4 text-left font-serif font-bold text-sm text-[#2D2D2A] hover:bg-[#F5F5F0] transition"
                >
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-[#5A5A40]" />
                    Having trouble logging in?
                  </span>
                  {expandedFaq === 'faq-login' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedFaq === 'faq-login' && (
                  <div className="p-4 pt-0 text-xs text-[#2D2D2A] border-t border-[#E0E0D5] bg-[#F5F5F0]/60 space-y-2">
                    <p>
                      • Ensure you are entering the exact phone number or email you registered with.
                    </p>
                    <p>
                      • Password must be at least 6 characters. If you forgot your password, reach out to official support via WhatsApp ({OFFICIAL_SUPPORT_PHONE}).
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 3: Can't Upload Products */}
              <div className="rounded-3xl bg-white border border-[#E0E0D5] overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === 'faq-upload' ? null : 'faq-upload')}
                  className="w-full flex items-center justify-between p-4 text-left font-serif font-bold text-sm text-[#2D2D2A] hover:bg-[#F5F5F0] transition"
                >
                  <span className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4 text-[#5A5A40]" />
                    How to post a product at University of Ilorin Mini Campus
                  </span>
                  {expandedFaq === 'faq-upload' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedFaq === 'faq-upload' && (
                  <div className="p-4 pt-0 text-xs text-[#2D2D2A] border-t border-[#E0E0D5] bg-[#F5F5F0]/60 space-y-2">
                    <p>
                      • Click <strong>&quot;Post Item&quot;</strong> in the navigation bar.
                    </p>
                    <p>
                      • Provide the item title, price in ₦, category, and select your pickup point at University of Ilorin Mini Campus (e.g., Mini Campus Gate, Student Center, or Library).
                    </p>
                    <p>
                      • Make sure your WhatsApp phone number is correct so buyers can message you in 1 tap!
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ 4: Issues with Orders or Scams */}
              <div className="rounded-3xl bg-white border border-[#E0E0D5] overflow-hidden shadow-xs">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === 'faq-scam' ? null : 'faq-scam')}
                  className="w-full flex items-center justify-between p-4 text-left font-serif font-bold text-sm text-[#2D2D2A] hover:bg-[#F5F5F0] transition"
                >
                  <span className="flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 text-rose-600" />
                    How do I protect myself from scams at University of Ilorin Mini Campus?
                  </span>
                  {expandedFaq === 'faq-scam' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedFaq === 'faq-scam' && (
                  <div className="p-4 pt-0 text-xs text-[#2D2D2A] border-t border-[#E0E0D5] bg-[#F5F5F0]/60 space-y-2">
                    <p className="font-bold text-[#2D2D2A]">University of Ilorin Mini Campus Safety Golden Rules:</p>
                    <ul className="list-disc pl-5 space-y-1 text-[#7A7A6A]">
                      <li><strong>Never pay in advance:</strong> Any seller requesting upfront delivery or deposit before you physically examine the product at Mini Campus is fraudulent.</li>
                      <li><strong>Safe Meetup Zones:</strong> Meet only at public Mini Campus zones during daytime (Mini Campus Main Gate, SUB Student Center, or Mini Campus Library).</li>
                      <li><strong>Look for Verified Badges:</strong> Prefer sellers with the &quot;Matric Verified&quot; badge.</li>
                    </ul>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('ticket')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-700 text-white font-semibold text-xs"
                      >
                        <AlertOctagon className="h-3.5 w-3.5" />
                        <span>File a Scam or Issue Report Now</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File a Ticket / Complaint Tab */}
        {activeTab === 'ticket' && (
          <div className="bg-white rounded-3xl border border-[#E0E0D5] p-5 sm:p-7 shadow-xs">
            <div className="mb-5">
              <h2 className="text-lg font-serif font-bold text-[#2D2D2A]">Lodge a Complaint or Support Ticket</h2>
              <p className="text-xs text-[#7A7A6A]">
                Submitted tickets are received directly by the marketplace administration and stored in the database for prompt investigation.
              </p>
            </div>

            {ticketSuccessId && (
              <div className="mb-6 p-4 rounded-2xl bg-[#E8E8DF] border border-[#E0E0D5] text-[#5A5A40] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-[#5A5A40]" />
                  <span>Ticket Lodged Successfully! (Ref #{ticketSuccessId})</span>
                </div>
                <p>
                  Our Campus Safety desk has received your report. The admin will review it and reply directly.
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={() => setActiveTab('my-tickets')}
                    className="font-bold underline text-[#2D2D2A]"
                  >
                    View Status in My Tickets →
                  </button>
                  <button
                    onClick={() => handleWhatsAppSupport(`Regarding Ticket #${ticketSuccessId}`)}
                    className="font-bold underline text-[#2D2D2A]"
                  >
                    Send to WhatsApp Support →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2A] mb-1">
                  Issue Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintTicket['category'])}
                  className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
                >
                  <option value="Registration Issue">Registration / Matric Verification Issue</option>
                  <option value="Login Issue">Login / Session Access Issue</option>
                  <option value="Upload Problem">Product Upload Bug</option>
                  <option value="Scam / Fraud Report">Scam / Fraud / Fake Seller Report</option>
                  <option value="Order Dispute">Order Dispute / Undelivered Goods</option>
                  <option value="Other">Other Inquiry / Feedback</option>
                </select>
              </div>

              {!currentUser && (
                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2A] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2A] mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seller requested upfront payment before meeting at Mini Campus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              {/* Accused Seller (if applicable) */}
              {(category === 'Scam / Fraud Report' || category === 'Order Dispute') && (
                <div>
                  <label className="block text-xs font-semibold text-[#2D2D2A] mb-1">
                    Suspect Seller Name or Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08123456789 or Seller Name"
                    value={accusedSeller}
                    onChange={(e) => setAccusedSeller(e.target.value)}
                    className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>
              )}

              {/* User Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2A] mb-1">
                  Your WhatsApp Phone Number for Response *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08142345678"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2D2A] mb-1">
                  Full Details & Explanation *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please give as much detail as possible (item name, conversation dates, Mini Campus location, etc.)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  id="submit-ticket-btn"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white text-xs font-bold py-3.5 shadow-sm transition disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppSupport(`Issue: ${title || category}`)}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold py-3.5 px-5 transition shadow-sm"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>Chat on WhatsApp Directly</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Tickets Tab */}
        {activeTab === 'my-tickets' && (
          <div className="space-y-4">
            <h2 className="text-lg font-serif font-bold text-[#2D2D2A]">Your Filed Support Tickets</h2>
            {userComplaints.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E0E0D5] p-8 text-center">
                <ShieldCheck className="h-10 w-10 text-[#7A7A6A] mx-auto mb-2" />
                <p className="text-xs text-[#7A7A6A]">You haven&apos;t filed any complaints or tickets yet.</p>
                <button
                  onClick={() => setActiveTab('ticket')}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#5A5A40] hover:underline"
                >
                  Lodge a Ticket →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {userComplaints.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-3xl bg-white border border-[#E0E0D5] shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#E8E8DF] text-[#5A5A40] px-2 py-0.5 rounded-full border border-[#E0E0D5]">
                          #{ticket.id}
                        </span>
                        <span className="text-xs font-semibold text-[#2D2D2A]">
                          {ticket.category}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          ticket.status === 'Resolved'
                            ? 'bg-[#5A5A40] text-white'
                            : ticket.status === 'Under Investigation'
                            ? 'bg-[#E8E8DF] text-[#2D2D2A] border border-[#E0E0D5]'
                            : 'bg-[#F5F5F0] text-[#5A5A40] border border-[#E0E0D5]'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-serif font-bold text-[#2D2D2A]">{ticket.title}</h4>
                    <p className="text-xs text-[#7A7A6A]">{ticket.description}</p>

                    {/* Admin Response Box if available */}
                    {ticket.adminReply && (
                      <div className="mt-3 p-3 rounded-2xl bg-[#E8E8DF]/70 border border-[#E0E0D5] text-xs">
                        <div className="flex items-center gap-1 text-[#5A5A40] font-bold text-[11px] mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#5A5A40]" />
                          <span>Campus Admin Response ({ticket.adminRepliedAt || 'Recent'}):</span>
                        </div>
                        <p className="text-[#2D2D2A] text-[11px]">{ticket.adminReply}</p>
                      </div>
                    )}

                    <div className="pt-2 text-[10px] text-[#7A7A6A]">
                      Filed on: {ticket.createdAt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
