'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Building2, MapPin, Home, ArrowRight } from 'lucide-react';

export default function DeveloperProjectsPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/developer/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const statusColors: Record<string, string> = {
    planning: 'bg-ochre/10 text-ochre',
    active: 'bg-ocean/10 text-ocean',
    sold_out: 'bg-success/10 text-success',
    complete: 'bg-ink/10 text-ink/60',
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-5xl mx-auto">

          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="eyebrow mb-3">Developer Portal</div>
              <h1 className="font-serif text-[36px] md:text-[48px] leading-[1.05] tracking-tightest font-light">
                My Projects
              </h1>
            </div>
            <Link href="/developer/projects/new" className="btn-primary flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> New Project
            </Link>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white border border-ink/10 rounded-lg p-6 animate-pulse">
                  <div className="h-5 bg-ink/10 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-ink/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-20 border border-dashed border-ink/20 rounded-lg">
              <Building2 className="h-10 w-10 text-ink/20 mx-auto mb-4" />
              <h3 className="font-serif text-[22px] font-light mb-2">No projects yet</h3>
              <p className="text-ink/50 mb-6 text-sm">Create your first project to list units on the platform.</p>
              <Link href="/developer/projects/new" className="btn-primary">Add your first project</Link>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <div key={project.id} className="bg-white border border-ink/10 rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-serif text-[20px] font-light">{project.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase ${statusColors[project.status] || 'bg-ink/10 text-ink/60'}`}>
                          {project.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-ink/50 mb-3">
                        {project.destination && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {project.destination}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Home className="h-3.5 w-3.5" /> {project.availableUnits}/{project.totalUnits} units available
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-ink/60 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[13px] text-ink/50 mb-1">From</div>
                      <div className="font-serif text-[20px] font-medium text-ocean">
                        ₦{project.priceFromKobo ? (Number(project.priceFromKobo) / 100).toLocaleString() : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-ink/8 flex items-center justify-between">
                    <div className="text-[12px] text-ink/40">
                      Created {new Date(project.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <Link href={`/developer/projects/${project.id}`} className="flex items-center gap-1 text-sm text-ocean hover:text-ocean/80 transition-colors font-medium">
                      Manage <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
