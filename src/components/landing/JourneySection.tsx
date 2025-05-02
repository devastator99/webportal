import { Card, CardContent } from '../ui/card';
import { Heart, Activity, Calendar, Clock, ChevronRight } from 'lucide-react';

export const JourneySection = () => {
  return (
    <section id="journey" className="py-24 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16" data-animate>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Your Journey at AnubhootiHealth
          </h2>
          <p className="text-gray-400">
            A transformative experience combining human expertise and technological innovation
          </p>
        </div>
        
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-600 via-purple-500 to-purple-700 hidden md:block"></div>
          
          {/* Timeline Items */}
          <div className="space-y-24">
            {/* Stage 1 */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center" data-animate>
              <div className="md:text-right md:pr-12">
                <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-800 text-white">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Personalized Care, Powered by People & AI
                </h3>
                <p className="text-gray-400 mb-6">
                  Doctor, dietitian, psychologist & AI—all in one seamless conversation.
                  Get expert advice tailored to your unique health needs.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute -top-4 -left-4 md:hidden w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold">1</span>
                </div>
                
                <Card className="bg-gray-800 border-gray-700 overflow-hidden animate-float">
                  <CardContent className="p-0">
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src="https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg" 
                        alt="Doctor consultation" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 inline-block">
                          <div className="flex items-center gap-2">
                            <Heart size={16} className="text-red-400" />
                            <span className="text-sm">Health Consultation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h4 className="text-lg font-semibold mb-2">AI-Enhanced Medical Assessment</h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Our system analyzes your health data to provide personalized recommendations
                      </p>
                      <div className="flex justify-between">
                        <div className="flex items-center text-sm text-purple-400">
                          <Activity size={14} className="mr-1" />
                          <span>Advanced Analytics</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Timeline node */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full border-4 border-gray-900 hidden md:block"></div>
            </div>
            
            {/* Stage 2 */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center" data-animate>
              <div className="md:order-2 md:pl-12">
                <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-800 text-white">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  One Chat, Full Care
                </h3>
                <p className="text-gray-400 mb-6">
                  Doctor, dietitian, exercise coach, psychologist & AI— all in one seamless conversation.
                  Comprehensive care without the hassle of multiple appointments.
                </p>
              </div>
              
              <div className="relative md:order-1">
                <div className="absolute -top-4 -left-4 md:hidden w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold">2</span>
                </div>
                
                <div className="flex flex-col space-y-4 animate-float-slow">
                  <div className="bg-purple-800 p-4 rounded-lg max-w-[80%] self-start relative">
                    <div className="text-sm">What's the best way to manage my blood sugar spikes after meals?</div>
                    <div className="absolute -bottom-2 -left-2 bg-gray-900 rounded-full p-1">
                      <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-900">You</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-800 p-4 rounded-lg max-w-[80%] self-end relative">
                    <div className="text-sm">Try adding more fiber to your meals and a 10-minute walk after eating to reduce glucose spikes.</div>
                    <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-1">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-900">Dr</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-teal-800 p-4 rounded-lg max-w-[80%] self-end relative">
                    <div className="text-sm">I recommend foods like leafy greens, nuts, and lentils which have a lower glycemic index and won't spike your blood sugar.</div>
                    <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-1">
                      <div className="w-6 h-6 rounded-full bg-teal-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-teal-900">RD</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-pink-800 p-4 rounded-lg max-w-[80%] self-end relative">
                    <div className="text-sm">I've analyzed your glucose patterns and created a personalized meal plan to minimize spikes while maintaining energy levels.</div>
                    <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-1">
                      <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-pink-900">AI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timeline node */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full border-4 border-gray-900 hidden md:block"></div>
            </div>
            
            {/* Stage 3 */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center" data-animate>
              <div className="md:text-right md:pr-12">
                <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-800 text-white">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Track What Matters, Change What Counts
                </h3>
                <p className="text-gray-400 mb-6">
                  Habit tracker with deep insights to turn effort into real change.
                  Visualize your progress and identify patterns for sustainable improvement.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute -top-4 -left-4 md:hidden w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold">3</span>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6 animate-float">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-semibold">Weekly Progress</h4>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                        <Calendar size={12} />
                      </button>
                      <button className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                        <Clock size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2 mb-8">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                      <div key={i} className="text-center">
                        <div className="text-xs text-gray-500 mb-1">{day}</div>
                        <div className={`w-full aspect-square rounded-lg ${i < 5 ? 'bg-purple-500' : 'bg-gray-700'} flex items-center justify-center`}>
                          {i < 5 && <span className="text-xs">✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'Morning Walk', progress: 80, color: 'bg-teal-500' },
                      { label: 'Healthy Meals', progress: 90, color: 'bg-purple-500' },
                      { label: 'Meditation', progress: 60, color: 'bg-blue-500' },
                      { label: 'Water Intake', progress: 70, color: 'bg-green-500' }
                    ].map((habit, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">{habit.label}</span>
                          <span className="text-sm">{habit.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${habit.color}`}
                            style={{ width: `${habit.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Timeline node */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full border-4 border-gray-900 hidden md:block"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};