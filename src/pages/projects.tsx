/**
 * Route: /projects — the real "all projects" page.
 *
 * Thin page wrapper (project convention: pages thin, support code
 * under src/projects/). All logic + layout lives in
 * src/projects/new-home/components/ProjectsPage.tsx.
 */
import ProjectsPage from '@/projects/new-home/components/ProjectsPage';

export default function Projects() {
  return <ProjectsPage />;
}
