"use client";

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, Users, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function ProjectsShowcase() {
  const projects = useQuery(api.projects.getActiveProjects);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Active Projects</h3>
        <p className="text-gray-600 dark:text-gray-400">Check back later for community development updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Project */}
      {projects[0] && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Project</h3>
          <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {projects[0].status?.replace('_', ' ')}
                    </Badge>
                    <span className={`text-sm font-medium ${getPriorityColor(projects[0].priority)} bg-white/20 px-2 py-1 rounded`}>
                      {projects[0].priority} priority
                    </span>
                  </div>
                  <h4 className="text-2xl font-bold mb-4">{projects[0].title}</h4>
                  <p className="text-emerald-100 mb-6 leading-relaxed">{projects[0].description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due: {projects[0].endDate ? new Date(projects[0].endDate).toLocaleDateString() : 'TBD'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {projects[0].assignedTo?.length || 0} members
                    </div>
                    {projects[0].budget && (
                      <div className="flex items-center gap-2">
                        <span>₱</span>
                        {projects[0].budget.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span className="font-semibold">{projects[0].progress || 0}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div 
                        className="bg-white h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${projects[0].progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <Link href={`/projects/${projects[0]._id}`}>
                    <Button className="w-full bg-white text-emerald-600 hover:bg-gray-100">
                      View Project Details
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Other Active Projects</h3>
          <Link href="/projects">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              View All Projects
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.slice(1, 7).map((project: any) => (
            <Card key={project._id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{project.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{project.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project.assignedTo?.length || 0}
                    </div>
                    {project.endDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <Link href={`/projects/${project._id}`}>
                  <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(projects.reduce((acc: number, p: any) => acc + (p.progress || 0), 0) / projects.length)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Progress</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {projects.reduce((acc: number, p: any) => acc + (p.assignedTo?.length || 0), 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Team Members</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">₱</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₱{projects.reduce((acc: number, p: any) => acc + (p.budget || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
