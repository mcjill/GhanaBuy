'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Memoji } from '@/components/memoji';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  ArrowRight,
  Send,
  Workflow,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  Mail
} from 'lucide-react';
import { JumpingMascot } from '@/components/ui/jumping-mascot';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Redirect to search page with query
    const params = new URLSearchParams();
    params.set('q', searchQuery.trim());
    router.push(`/search?${params.toString()}`);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackStatus('sending');

    const mailtoLink = `mailto:elliotbrenyasarfo@gmail.com?subject=Can I Buy Feedback&body=${encodeURIComponent(feedbackMessage)}`;
    try {
      window.location.href = mailtoLink;
    } catch (error) {
      console.error('Error opening email client:', error);
      // Fallback: copy email to clipboard or show error
      navigator.clipboard?.writeText(`elliotbrenyasarfo@gmail.com - ${feedbackMessage}`);
    }
    
    // Reset form
    setFeedbackEmail('');
    setFeedbackMessage('');
    setFeedbackStatus('sent');
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setFeedbackStatus('idle');
    }, 3000);
  };

  const workflowSteps = [
    {
      icon: Search,
      title: "Search Product",
      description: "Enter the product you're interested in purchasing"
    },
    {
      icon: DollarSign,
      title: "Set Budget",
      description: "Input your budget and financial information"
    },
    {
      icon: TrendingUp,
      title: "Analysis",
      description: "Get instant affordability analysis and recommendations"
    },
    {
      icon: ShoppingCart,
      title: "Compare & Decide",
      description: "Compare prices across platforms and make informed decisions"
    }
  ];

  const faqs = [
    {
      question: "How does Can I Buy work?",
      answer: "Can I Buy analyzes your financial information and product prices to help you make informed purchasing decisions. It compares prices across multiple platforms and provides personalized affordability insights."
    },
    {
      question: "What currencies are supported?",
      answer: "We support multiple currencies including GHS (Ghana Cedi), USD, EUR, GBP, NGN, and more. All prices are converted in real-time using current exchange rates."
    },
    {
      question: "How accurate are the price comparisons?",
      answer: "Our prices are fetched in real-time from various e-commerce platforms. We primarily focus on Jiji Ghana and Amazon, ensuring you get accurate and current pricing information."
    },
    {
      question: "Is my financial information secure?",
      answer: "Yes! We don't store any of your financial information. All calculations are done in real-time and your data is never saved or shared."
    }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="hero-section relative w-full min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="financial-icons">
          {/* Financial Decision Maker */}
          <div className="icon-wrapper icon-1 path-1">
            <Memoji type="thinking" className="shadow-xl" />
          </div>
          
          {/* Smart Shopper */}
          <div className="icon-wrapper icon-2 path-2">
            <Memoji type="shopping" className="shadow-xl" />
          </div>
          
          {/* Successful Saver */}
          <div className="icon-wrapper icon-3 path-3">
            <Memoji type="happy" className="shadow-xl" />
          </div>
          
          {/* Money Saved */}
          <div className="icon-wrapper icon-4 path-4">
            <Memoji type="excited" className="shadow-xl" />
          </div>
          
          {/* Savvy Spender */}
          <div className="icon-wrapper icon-5 path-5">
            <Memoji type="winking" className="shadow-xl" />
          </div>
          
          {/* Wise Purchase */}
          <div className="icon-wrapper icon-6 path-1">
            <Memoji type="thumbs-up" className="shadow-xl" />
          </div>
        </div>
        
        <div className="z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-text">
              <span className="block mb-2">Stop Guessing</span>
              <span className="block">Start Knowing</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Make confident purchase decisions with real-time price comparisons across multiple stores.
          </p>

          {/* Quick Search */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products (e.g., iPhone, Samsung, laptop)..."
                className="flex-1 px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/compare" 
              className="btn-primary px-8 py-3 text-lg"
            >
              Advanced Search
            </Link>
            <Link 
              href="/analyze" 
              className="btn-secondary px-8 py-3 text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
      
      <div className="w-full py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Smart Financial Decision Making
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Compare Prices</h3>
              <p className="text-gray-600">Find the best deals across multiple platforms instantly.</p>
            </div>
            <div className="feature-card p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Track History</h3>
              <p className="text-gray-600">Monitor price changes and trends over time.</p>
            </div>
            <div className="feature-card p-6 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Smart Alerts</h3>
              <p className="text-gray-600">Get notified when prices drop to your target range.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Section */}
      <section className="w-full py-16 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow our simple process to make smart financial decisions
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-blue-200 transform -translate-x-1/2 hidden md:block" />

            {workflowSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                className={`relative flex items-center mb-6 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } flex-col`}
              >
                {/* Content */}
                <div className={`md:w-1/2 p-4 ${
                  index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'
                } text-center md:text-left`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <h3 className="text-xl font-semibold mb-2 flex items-center justify-center md:justify-start gap-2">
                      {index % 2 === 0 ? (
                        <>
                          {step.title}
                          <step.icon className="w-6 h-6 text-blue-600" />
                        </>
                      ) : (
                        <>
                          <step.icon className="w-6 h-6 text-blue-600" />
                          {step.title}
                        </>
                      )}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </motion.div>
                </div>

                {/* Timeline Node */}
                <div className="md:w-8 md:h-8 w-12 h-12 absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                      delay: index * 0.1 + 0.3
                    }}
                    className="w-full h-full"
                  >
                    <div className="w-full h-full rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                  </motion.div>
                </div>

                {/* Empty space for opposite side */}
                <div className="md:w-1/2" />
              </motion.div>
            ))}
          </div>

          {/* Final Checkmark */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: workflowSteps.length * 0.1 + 0.5 }}
            className="flex justify-center mt-4"
          >
            <div className="bg-green-500 text-white rounded-full p-4">
              <CheckCircle className="w-8 h-8" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Can I Buy
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="mb-6"
              >
                <Card className="p-6 hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-semibold mb-2 flex items-center">
                    <HelpCircle className="w-5 h-5 text-blue-600 mr-2" />
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 ml-7">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="w-full py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Send Us Feedback</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We'd love to hear your thoughts on Can I Buy. Your feedback helps us improve!
            </p>
          </motion.div>

          <div className="max-w-xl mx-auto">
            <Card className="p-6">
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Share your thoughts with us..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    required
                    className="min-h-[120px]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={feedbackStatus === 'sending' || feedbackStatus === 'sent'}
                >
                  {feedbackStatus === 'sending' ? (
                    <>
                      <Mail className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : feedbackStatus === 'sent' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Sent!
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
