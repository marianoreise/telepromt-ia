'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'

export const ROLE_GROUPS = [
  {
    label: 'Tecnología & Desarrollo',
    options: [
      'Software Engineer', 'Frontend Developer', 'Backend Developer',
      'Full Stack Developer', 'Mobile Developer', 'DevOps / SRE Engineer',
      'Data Engineer', 'Data Scientist / ML Engineer', 'QA Engineer',
      'Tech Lead / Engineering Manager', 'CTO / Director de Tecnología',
    ],
  },
  {
    label: 'Producto & Diseño',
    options: [
      'Product Manager', 'Product Owner', 'UX/UI Designer',
      'UX Researcher', 'Head of Product',
    ],
  },
  {
    label: 'Negocios & Comercial',
    options: [
      'Sales Executive', 'Account Manager', 'Business Development Manager',
      'Customer Success Manager', 'Marketing Manager',
    ],
  },
  {
    label: 'Finanzas & Operaciones',
    options: [
      'Finance Manager / CFO', 'Operations Manager',
      'Project Manager / PMO', 'Scrum Master / Agile Coach',
    ],
  },
  {
    label: 'Consultoría & Liderazgo',
    options: [
      'Management Consultant', 'Strategy Consultant',
      'CEO / Founder / Co-Founder', 'General Manager',
    ],
  },
  {
    label: 'Recursos Humanos',
    options: ['HR Manager / People & Culture', 'Talent Acquisition / Recruiter'],
  },
  {
    label: 'Legal',
    options: ['Legal Counsel / Abogado Corporativo', 'Compliance Officer'],
  },
]

const ALL_OPTIONS = ROLE_GROUPS.flatMap(g => g.options)

interface RoleComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RoleCombobox({ value, onChange, placeholder = 'Seleccioná tu rol...' }: RoleComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Detect if current value is a custom one (not in predefined list)
  useEffect(() => {
    if (value && !ALL_OPTIONS.includes(value) && value !== '') {
      setShowCustom(true)
      setCustomValue(value)
    }
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = query.trim()
    ? ROLE_GROUPS
        .map(g => ({ ...g, options: g.options.filter(o => o.toLowerCase().includes(query.toLowerCase())) }))
        .filter(g => g.options.length > 0)
    : ROLE_GROUPS

  function selectOption(opt: string) {
    setShowCustom(false)
    setCustomValue('')
    onChange(opt)
    setOpen(false)
    setQuery('')
  }

  function selectCustom() {
    setShowCustom(true)
    onChange('')
    setOpen(false)
    setQuery('')
    setTimeout(() => document.getElementById('custom-role-input')?.focus(), 50)
  }

  const displayLabel = showCustom
    ? (customValue || '')
    : (value || '')

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', height: 40, padding: '0 12px',
          border: '1px solid #d1d5db', borderRadius: 8,
          background: 'white', fontSize: 14, cursor: 'pointer',
          color: displayLabel ? '#111827' : '#9ca3af',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown size={16} style={{ flexShrink: 0, marginLeft: 8, color: '#6b7280', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: 4, background: 'white', border: '1px solid #e5e7eb',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          maxHeight: 320, display: 'flex', flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar rol..."
              style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', color: '#111827' }}
            />
          </div>

          {/* Options list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(group => (
              <div key={group.label}>
                <div style={{ padding: '6px 12px 2px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {group.label}
                </div>
                {group.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => selectOption(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '7px 12px',
                      background: value === opt ? '#eff6ff' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontSize: 13, color: '#111827',
                    }}
                    onMouseEnter={e => { if (value !== opt) (e.currentTarget as HTMLElement).style.background = '#f9fafb' }}
                    onMouseLeave={e => { if (value !== opt) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    {opt}
                    {value === opt && <Check size={14} style={{ color: '#1B6CA8', flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            ))}

            {/* Otro option */}
            <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0 0' }}>
              <button
                type="button"
                onClick={selectCustom}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '7px 12px',
                  background: showCustom ? '#eff6ff' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 13, color: '#374151', fontStyle: 'italic',
                }}
              >
                Otro (especificar)
                {showCustom && <Check size={14} style={{ color: '#1B6CA8', flexShrink: 0 }} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom text input shown when "Otro" is selected */}
      {showCustom && (
        <input
          id="custom-role-input"
          type="text"
          value={customValue}
          onChange={e => { setCustomValue(e.target.value); onChange(e.target.value) }}
          placeholder="Escribí tu rol..."
          style={{
            marginTop: 8, display: 'block', width: '100%', height: 40,
            padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 8,
            background: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => (e.target.style.borderColor = '#3b82f6')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
      )}
    </div>
  )
}
