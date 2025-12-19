/**
 * Studio Agents - Premium AI Music Studio Landing Page
 * Modern, vibrant design for creative people
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, Music, Crown, Users, Target, Rocket, Menu, X } from 'lucide-react';
import './App.css';

// Agent showcase data
const AGENTS = [
  {
    name: 'Ghostwriter',
    description: 'AI lyricist creating bars on demand',
    category: 'Writing',
    icon: Sparkles,
    color: 'from-cyan-500 to-blue-500'
  },
  {
    name: 'Beat Lab',
    description: 'Generate production ideas instantly',
    category: 'Production',
    icon: Zap,
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Album Artist',
    description: 'Create stunning album artwork with AI',
    category: 'Visual',
    icon: Music,
    color: 'from-orange-500 to-red-500'
  },
  {
    name: 'Trend Hunter',
    description: 'Discover what\'s hot right now',
    category: 'Research',
    icon: Target,
    color: 'from-emerald-500 to-green-500'
  },
  {
    name: 'Collab Connect',
    description: 'Find the perfect collaborators',
    category: 'Networking',
    icon: Users,
    color: 'from-indigo-500 to-purple-500'
  },
  {
    name: 'Release Manager',
    description: 'Strategic release planning AI',
    category: 'Strategy',
    icon: Rocket,
    color: 'from-pink-500 to-orange-500'
  }
];

// Landing Page Component
function LandingPage({ onEnter }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredAgent, setHoveredAgent] = useState(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 py-20 text-center">
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-3xl mx-auto relative">
          {/* Logo/Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles size={48} className="text-white" />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Studio Agents
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            AI-powered music creation studio built for creative people who want to make magic happen instantly
          </p>

          {/* Features */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-cyan-400" />
              <span>Instant Creation</span>
            </div>
            <div className="flex items-center gap-2">
              <Music size={20} className="text-purple-400" />
              <span>AI Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown size={20} className="text-pink-400" />
              <span>Premium Tools</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onEnter}
            className="relative group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 active:scale-95"
          >
            <span>Enter Studio</span>
            <ArrowRight size={24} />
          </button>

          {/* Scroll indicator */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="text-gray-500 text-sm">Scroll to explore</div>
          </div>
        </div>
      </section>

      {/* Agent Showcase Section */}
      <section className="relative z-10 px-4 py-20 max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Creative Studio Agents</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Six powerful AI agents ready to elevate every aspect of your music production
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENTS.map((agent, idx) => {
            const Icon = agent.icon;
            const isHovered = hoveredAgent === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredAgent(idx)}
                onMouseLeave={() => setHoveredAgent(null)}
                className="group relative bg-gradient-to-br from-gray-900/50 to-gray-950 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                {/* Background glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                  background: `linear-gradient(135deg, rgba(${agent.color.includes('cyan') ? '0,255,255' : agent.color.includes('purple') ? '168,85,247' : '236,72,153'}, 0.1), rgba(255,255,255,0))`,
                }}></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className="text-white" />
                  </div>

                  {/* Title and category */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300">
                    {agent.name}
                  </h3>
                  <p className={`text-sm font-medium mb-3 px-2 py-1 rounded inline-block`} style={{
                    background: `linear-gradient(135deg, rgba(${agent.color.includes('cyan') ? '0,255,255' : agent.color.includes('purple') ? '168,85,247' : '236,72,153'}, 0.15), rgba(255,255,255,0.05))`,
                    color: agent.color.includes('cyan') ? '#06b6d4' : agent.color.includes('purple') ? '#a855f7' : '#ec4899'
                  }}>
                    {agent.category}
                  </p>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {agent.description}
                  </p>

                  {/* Hover arrow */}
                  <div className={`mt-4 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`} style={{
                    color: agent.color.includes('cyan') ? '#06b6d4' : agent.color.includes('purple') ? '#a855f7' : '#ec4899'
                  }}>
                    Explore <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 px-4 py-20 bg-gradient-to-b from-transparent to-purple-950/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Why Choose <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Studio Agents?</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Create Instantly', desc: 'AI-powered generation from simple prompts in seconds' },
              { icon: Crown, title: 'Professional Quality', desc: 'Studio-grade output powered by advanced AI models' },
              { icon: Users, title: 'Stay Creative', desc: 'Focus on your vision, let AI handle the work' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 px-4 py-20 max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Simple, <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Transparent Pricing</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: 'Free',
              price: '$0',
              features: ['3 uses per agent', '10s audio output', 'Basic features', 'Session access']
            },
            {
              name: 'Creator',
              price: '$4.99',
              period: '/month',
              features: ['100 uses/month', '30s audio output', 'Save creations', 'Priority processing'],
              popular: true
            },
            {
              name: 'Studio Pro',
              price: '$14.99',
              period: '/month',
              features: ['Unlimited uses', '60s audio output', 'All Creator features', 'API access', 'Team collab']
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 transform md:scale-105'
                  : 'bg-gray-900/50 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-400">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-bold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 text-white'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to create something <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">amazing?</span>
        </h2>
        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 active:scale-95"
        >
          <span>Launch Studio Now</span>
          <ArrowRight size={24} />
        </button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 px-4 py-12 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Studio Agents. Built for creative people.</p>
      </footer>
    </div>
  );
}

// Main App Component
export default function App() {
  const [currentView, setCurrentView] = useState('landing');

  if (currentView === 'landing') {
    return <LandingPage onEnter={() => setCurrentView('studio')} />;
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Studio Agents <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Coming Soon</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          The full studio interface with all 6 AI agents is being prepared. In the meantime, explore our landing page.
        </p>
        <button
          onClick={() => setCurrentView('landing')}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 active:scale-95"
        >
          <ArrowRight size={20} /> Back to Landing
        </button>
      </div>
    </div>
  );
}
