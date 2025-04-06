'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Range } from 'react-range';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    ageRange: {
      min: number;
      max: number;
    };
    entrepreneurTypes: string[];
    businessStages: string[];
    location: string;
    onlineOnly: boolean;
  };
  onFiltersChange: (filters: FilterSidebarProps['filters']) => void;
}

const entrepreneurTypes = [
  'Startup Founder',
  'Small Business Owner',
  'Serial Entrepreneur',
  'Aspiring Entrepreneur',
  'Investor',
  'Business Consultant'
];

const businessStages = [
  'Idea Stage',
  'Early Development',
  'MVP/Beta',
  'Revenue Generating',
  'Scaling',
  'Established Business'
];

export default function FilterSidebar({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}: FilterSidebarProps) {
  const updateFilters = (updates: Partial<FilterSidebarProps['filters']>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleEntrepreneurType = (type: string) => {
    const types = filters.entrepreneurTypes.includes(type)
      ? filters.entrepreneurTypes.filter(t => t !== type)
      : [...filters.entrepreneurTypes, type];
    updateFilters({ entrepreneurTypes: types });
  };

  const toggleBusinessStage = (stage: string) => {
    const stages = filters.businessStages.includes(stage)
      ? filters.businessStages.filter(s => s !== stage)
      : [...filters.businessStages, stage];
    updateFilters({ businessStages: stages });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-96">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          Filters
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {/* Age Range */}
                      <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Age Range</h3>
                        <div className="px-2">
                          <Range
                            step={1}
                            min={18}
                            max={65}
                            values={[filters.ageRange.min, filters.ageRange.max]}
                            onChange={([min, max]) =>
                              updateFilters({ ageRange: { min, max } })
                            }
                            renderTrack={({ props, children }) => (
                              <div
                                {...props}
                                className="h-1 w-full bg-gray-200 rounded-full"
                              >
                                {children}
                              </div>
                            )}
                            renderThumb={({ props }) => (
                              <div
                                {...props}
                                className="h-5 w-5 rounded-full bg-blue-600 shadow"
                              />
                            )}
                          />
                          <div className="flex justify-between mt-2 text-sm text-gray-600">
                            <span>{filters.ageRange.min}</span>
                            <span>{filters.ageRange.max}</span>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                        <input
                          type="text"
                          value={filters.location}
                          onChange={(e) =>
                            updateFilters({ location: e.target.value })
                          }
                          placeholder="Enter city or region"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Online Only */}
                      <div className="mb-8">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={filters.onlineOnly}
                            onChange={(e) =>
                              updateFilters({ onlineOnly: e.target.checked })
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            Online now only
                          </span>
                        </label>
                      </div>

                      {/* Entrepreneur Types */}
                      <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">
                          Entrepreneur Type
                        </h3>
                        <div className="space-y-2">
                          {entrepreneurTypes.map((type) => (
                            <label
                              key={type}
                              className="flex items-center space-x-3"
                            >
                              <input
                                type="checkbox"
                                checked={filters.entrepreneurTypes.includes(type)}
                                onChange={() => toggleEntrepreneurType(type)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Business Stages */}
                      <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">
                          Business Stage
                        </h3>
                        <div className="space-y-2">
                          {businessStages.map((stage) => (
                            <label
                              key={stage}
                              className="flex items-center space-x-3"
                            >
                              <input
                                type="checkbox"
                                checked={filters.businessStages.includes(stage)}
                                onChange={() => toggleBusinessStage(stage)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">{stage}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Apply Filters Button */}
                      <div className="sticky bottom-0 bg-white pt-4 pb-6">
                        <button
                          onClick={onClose}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 