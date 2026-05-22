import { useTags } from '@/context/TagContext';

function TagFilterStrip() {
  const { activeTags, tagColors, toggleActiveTag, clearActiveTags } = useTags();

  if (activeTags.length === 0) return null;

  return (
    <div className="tag-filter-strip">
      <span className="tag-filter-label">Filter:</span>
      {activeTags.map(tag => (
        <button
          key={tag}
          type="button"
          className="tag-filter-chip"
          style={{
            color: tagColors[tag] ?? 'var(--text-primary)',
            borderColor: tagColors[tag] ?? 'var(--border)',
            background: 'transparent',
          }}
          onClick={() => toggleActiveTag(tag)}
          title={`Remove "${tag}" filter`}
        >
          <span
            className="tag-filter-chip-dot"
            style={{ background: tagColors[tag] ?? 'var(--text-muted)' }}
          />
          {tag}
          <span style={{ opacity: 0.6, marginLeft: 2 }}>✕</span>
        </button>
      ))}
      <button type="button" className="tag-filter-clear" onClick={clearActiveTags}>
        Clear all
      </button>
    </div>
  );
}

export default TagFilterStrip;
