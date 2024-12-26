'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Clock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { blogPosts } from '../data';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Find the blog post by slug
  const post = blogPosts.find(post => post.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container-apple mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Post not found</h1>
            <Link href="/blog" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Return to blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container-apple mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          href="/blog"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative h-64 w-full mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-gradient-xy">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-2xl font-medium">Coming Soon</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-1" />
              {post.date}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {post.readTime}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {post.author}
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          {/* Preview Content */}
          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <p className="text-blue-700">
                This article is coming soon! We're working hard to bring you valuable content about {post.title.toLowerCase()}.
                Subscribe to our newsletter to be notified when it's published.
              </p>
            </div>

            <h2>What to Expect</h2>
            <p>{post.excerpt}</p>

            <h2>Topics We'll Cover</h2>
            <ul>
              {post.topics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>

            {/* Newsletter Signup */}
            <div className="bg-gray-100 p-8 rounded-2xl mt-12">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Get Notified When This Article is Published
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to read this article when it's published. We'll send you an email as soon as it's ready.
              </p>
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Notify Me
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
