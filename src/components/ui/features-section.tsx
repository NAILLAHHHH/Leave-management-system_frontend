
import { 
  CalendarDays, 
  Clock, 
  FileCheck, 
  UserCheck 
} from "lucide-react";

const features = [
  {
    name: 'Multiple Leave Types',
    description: 'Support for PTO, Sick Leave, Compassionate Leave, and Maternity Leave as per Rwandan Labor Law.',
    icon: CalendarDays,
  },
  {
    name: 'Easy Leave Application',
    description: 'Simple process to request time off with automatic balance calculation.',
    icon: Clock,
  },
  {
    name: 'Document Management',
    description: 'Upload and manage supporting documents for leave requests.',
    icon: FileCheck,
  },
  {
    name: 'Approval Workflow',
    description: 'Streamlined approval process with notifications for all parties.',
    icon: UserCheck,
  },
];

export function FeaturesSection() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Efficient Management</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to manage leave requests
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
