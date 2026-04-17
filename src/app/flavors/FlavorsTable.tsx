'use client';

import { useState } from 'react';
import Link from 'next/link';
import FlavorDeleteButton from './FlavorDeleteButton';
import FlavorDuplicateButton from './FlavorDuplicateButton';

export interface FlavorCreator {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface FlavorRow {
  id: number;
  slug: string;
  description: string | null;
  created_datetime_utc: string;
  humor_flavor_steps: { id: number }[];
  profiles: FlavorCreator | null;
}

interface Props {
  flavors: FlavorRow[];
}

export default function FlavorsTable({ flavors }: Props) {
  const [slugSearch, setSlugSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState('');

  const filtered = flavors.filter((f) => {
    const matchSlug = slugSearch.trim()
      ? f.slug.toLowerCase().includes(slugSearch.trim().toLowerCase())
      : true;
    const matchEmail = emailFilter.trim()
      ? (f.profiles?.email ?? '').toLowerCase().includes(emailFilter.trim().toLowerCase())
      : true;
    return matchSlug && matchEmail;
  });

  return (
    <div className="flavors-table-root">
      {/* Slug search bar */}
      <div className="flavors-search-bar">
        <input
          type="search"
          className="input"
          placeholder="Search by slug…"
          value={slugSearch}
          onChange={(e) => setSlugSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No matching flavors</div>
            <div className="empty-state-body">
              Try adjusting your slug or email filter.
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Slug</th>
                <th className="col-hide-mobile" style={{ width: '100%' }}>Description</th>
                <th className="col-hide-mobile" style={{ whiteSpace: 'nowrap' }}>Steps</th>
                  <th style={{ whiteSpace: 'nowrap' }}>
                  <div className="th-with-filter">
                    <span>Created By</span>
                    <input
                      type="search"
                      className="th-filter-input"
                      placeholder="Filter by email…"
                      value={emailFilter}
                      onChange={(e) => setEmailFilter(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </th>
                <th className="col-hide-tablet" style={{ whiteSpace: 'nowrap' }}>Created</th>
                <th style={{ whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((flavor) => {
                const stepCount = Array.isArray(flavor.humor_flavor_steps)
                  ? flavor.humor_flavor_steps.length
                  : 0;
                const email = flavor.profiles?.email ?? null;
                return (
                  <tr key={flavor.id}>
                    <td>
                      <span className="badge badge-primary mono">{flavor.slug}</span>
                    </td>
                    <td className="col-hide-mobile" style={{ width: '100%' }}>
                      <span className="text-muted text-sm">
                        {flavor.description || (
                          <em style={{ color: 'var(--text-dim)' }}>No description</em>
                        )}
                      </span>
                    </td>
                    <td className="col-hide-mobile">
                      <span className="badge">
                        {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {email ?? <em style={{ color: 'var(--text-dim)' }}>Unknown</em>}
                    </td>
                    <td className="col-hide-tablet text-sm text-muted">
                      {new Date(flavor.created_datetime_utc).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/flavors/${flavor.id}/edit`} className="button-secondary button-sm">
                          Edit
                        </Link>
                        <Link href={`/flavors/${flavor.id}/steps`} className="button-secondary button-sm">
                          Steps
                        </Link>
                        <Link href={`/flavors/${flavor.id}/captions`} className="button-ghost button-sm">
                          Captions
                        </Link>
                        <FlavorDuplicateButton id={flavor.id} sourceSlug={flavor.slug} />
                        <FlavorDeleteButton id={flavor.id} stepCount={stepCount} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
