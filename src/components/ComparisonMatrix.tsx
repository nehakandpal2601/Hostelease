import { CheckCircle2, ShieldCheck, Star, Trash2, ArrowRight } from 'lucide-react';
import { HostelListing } from '../types/hostelease';

interface ComparisonMatrixProps {
  allListings: HostelListing[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectListing: (listing: HostelListing) => void;
  onBackToDiscover: () => void;
}

export function ComparisonMatrix({
  allListings,
  compareIds,
  onToggleCompare,
  onSelectListing,
  onBackToDiscover,
}: ComparisonMatrixProps) {
  const selected = allListings.filter((item) => compareIds.includes(item.id));

  const lowestRent = selected.length > 0 ? Math.min(...selected.map((s) => s.monthlyRent)) : 0;
  const closestDist = selected.length > 0 ? Math.min(...selected.map((s) => s.distanceKm)) : 0;
  const highestSafety = selected.length > 0 ? Math.max(...selected.map((s) => s.safetyScore)) : 0;

  return (
    <section className="space-y-8" aria-labelledby="compare-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="compare-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Side-by-Side PG & Hostel Comparison
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Compare standardized rent, deposit, safety audits, rules, and verified ratings in one view.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToDiscover}
          className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          Back to Listings
        </button>
      </div>

      {/* Quick Picker to Add Properties if < 3 */}
      {selected.length < 3 && allListings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
            Add listings to compare ({selected.length}/3 selected):
          </p>
          <div className="flex flex-wrap gap-2">
            {allListings
              .filter((item) => !compareIds.includes(item.id))
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleCompare(item.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-teal-600 dark:hover:border-teal-400 transition-colors"
                >
                  + {item.name} (₹{item.monthlyRent.toLocaleString('en-IN')})
                </button>
              ))}
          </div>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            No properties selected yet
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-5">
            Click &ldquo;Compare&rdquo; on up to 3 Dehradun PGs above or pick from the directory.
          </p>
          <button
            type="button"
            onClick={onBackToDiscover}
            className="h-10 px-5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
          >
            Browse Verified PGs
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 w-48 text-xs font-semibold text-slate-500 dark:text-slate-400 align-top">
                  Comparison Criteria
                </th>
                {selected.map((item) => (
                  <th key={item.id} className="p-4 align-top border-l border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
                          {item.locality}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {item.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleCompare(item.id)}
                        aria-label={`Remove ${item.name} from comparison`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Monthly Rent</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{item.monthlyRent.toLocaleString('en-IN')}
                    </span>
                    {selected.length > 1 && item.monthlyRent === lowestRent && (
                      <span className="block text-[11px] font-sans font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
                        Lowest monthly rent
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Security Deposit</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    ₹{item.securityDeposit.toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Distance to Campus</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800">
                    <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                      {item.distanceKm} km
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {item.nearCampus}
                    </span>
                    {selected.length > 1 && item.distanceKm === closestDist && (
                      <span className="block text-[11px] font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
                        Closest to campus
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Verification & Safety</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span>{item.safetyScore}/10</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.safetyFeatures.join(' · ')}
                    </p>
                    {selected.length > 1 && item.safetyScore === highestSafety && (
                      <span className="block text-[11px] font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
                        Highest safety audit
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Room & Policy</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.roomType} · {item.gender}
                    </p>
                    <p className="mt-1 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {item.availableBeds} beds open
                    </p>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Included Facilities</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800">
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {item.facilities.map((fac) => (
                        <li key={fac} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{fac}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">House Rules</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.houseRules}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Verified Student Rating</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {item.reviewCount > 0 ? item.avgRating.toFixed(1) : 'New'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                      ({item.reviewCount} reviews)
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">Next Step</td>
                {selected.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onSelectListing(item)}
                      className="w-full h-10 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Schedule Visit / Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
