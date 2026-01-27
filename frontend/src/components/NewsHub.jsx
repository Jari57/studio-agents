import React, { useState, useMemo } from 'react';
import { 
  Search, RefreshCw, ChevronUp, ChevronRight, ExternalLink,
  Zap, TrendingUp, Flame, Clock, PlayCircle, Share2, Bookmark,
  Twitter, Globe, Newspaper, Radio, Mic, Video, X, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * NewsHub - Modern, engaging news feed with trending stories
 * Features: Category pills, trending section, card styles, social sharing
 */
function NewsHub({ 
  newsItems = [],
  newsSearch,
  setNewsSearch,
  isLoadingNews,
  onRefresh,
  hasMoreNews,
  onLoadMore,
  setPlayingItem
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedNews, setExpandedNews] = useState(new Set());
  const [savedArticles, setSavedArticles] = useState(new Set());

  // Categories with icons
  const categories = [
    { id: 'all', label: 'All News', icon: Newspaper },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'industry', label: 'Industry', icon: Globe },
    { id: 'artists', label: 'Artists', icon: Mic },
    { id: 'technology', label: 'Tech', icon: Zap },
  ];

  // Filter news by category and search
  const filteredNews = useMemo(() => {
    return newsItems.filter(item => {
      // Category filter
      if (activeCategory !== 'all') {
        const categoryMatch = item.tags?.some(tag => 
          tag.toLowerCase().includes(activeCategory.toLowerCase())
        ) || item.source?.toLowerCase().includes(activeCategory);
        if (!categoryMatch && activeCategory !== 'trending') return false;
      }
      
      // Search filter
      if (newsSearch) {
        const query = newsSearch.toLowerCase();
        return (
          item.title?.toLowerCase().includes(query) ||
          item.content?.toLowerCase().includes(query) ||
          item.source?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [newsItems, activeCategory, newsSearch]);

  // Get trending stories (just now or recent)
  const trendingStories = useMemo(() => {
    return newsItems
      .filter(item => item.time === 'Just now' || item.time?.includes('min'))
      .slice(0, 3);
  }, [newsItems]);

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedNews);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNews(newExpanded);
  };

  const toggleSave = (id) => {
    const newSaved = new Set(savedArticles);
    if (newSaved.has(id)) {
      newSaved.delete(id);
      toast.success('Removed from saved');
    } else {
      newSaved.add(id);
      toast.success('Article saved');
    }
    setSavedArticles(newSaved);
  };

  const handleShare = (item) => {
    const text = `${item.title} - via @StudioAgentsAI`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Get source icon
  const getSourceIcon = (source) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('twitter') || s.includes('x')) return Twitter;
    if (s.includes('radio') || s.includes('podcast')) return Radio;
    if (s.includes('video') || s.includes('youtube')) return Video;
    return Globe;
  };

  return (
    <div className="news-hub-v2 animate-fadeInUp">
      {/* Hero Header */}
      <div className="news-header-hero" style={{
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '24px',
        border: '1px solid rgba(236, 72, 153, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-30px', 
          right: '-30px', 
          width: '150px', 
          height: '150px', 
          background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)', 
          pointerEvents: 'none' 
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '1.75rem', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Flame size={28} style={{ color: 'var(--color-pink)' }} />
              News
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Latest trends and insights from the music world
            </p>
          </div>
          
          <button 
            className={`cta-button-secondary touch-feedback ${isLoadingNews ? 'spinning' : ''}`}
            onClick={onRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={18} className={isLoadingNews ? 'spin-animation' : ''} />
            Refresh
          </button>
        </div>

        {/* Trending Stories Mini-Carousel */}
        {trendingStories.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px',
              color: 'var(--color-pink)',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              <TrendingUp size={16} />
              TRENDING NOW
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'none'
            }}>
              {trendingStories.map(story => (
                <div 
                  key={story.id}
                  onClick={() => toggleExpand(story.id)}
                  className="touch-feedback"
                  style={{
                    minWidth: '260px',
                    padding: '14px 16px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    marginBottom: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <span className="live-pulse-dot" />
                    {story.source} • {story.time}
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.9rem', 
                    fontWeight: '500',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {story.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search & Categories */}
      <div style={{ marginBottom: '24px' }}>
        <div className="search-bar-v2" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0 14px' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input 
              type="text"
              placeholder="Search Drake, Beyoncé, hip-hop, Grammy..."
              value={newsSearch}
              onChange={(e) => setNewsSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onRefresh && onRefresh()}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '12px 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}
            />
            {newsSearch && (
              <button 
                onClick={() => setNewsSearch('')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={onRefresh}
            disabled={isLoadingNews}
            className="cta-button-premium"
            style={{ 
              padding: '12px 20px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <Search size={16} />
            Search
          </button>
        </div>

        <div className="filter-chips" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <cat.icon size={14} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed */}
      {filteredNews.length === 0 ? (
        <div className="empty-state-v2">
          <div className="empty-state-icon">
            <Newspaper size={36} />
          </div>
          <h3 className="empty-state-title">No news found</h3>
          <p className="empty-state-desc">
            {newsSearch 
              ? `No results for "${newsSearch}"`
              : 'Check back soon for the latest updates'
            }
          </p>
        </div>
      ) : (
        <div className="stagger-children" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {filteredNews.map((item) => {
            const isExpanded = expandedNews.has(item.id);
            const isSaved = savedArticles.has(item.id);
            const SourceIcon = getSourceIcon(item.source);
            
            return (
              <article 
                key={item.id}
                className="news-card-modern touch-feedback"
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Accent Bar */}
                <div style={{
                  height: '4px',
                  background: item.time === 'Just now' || item.time?.includes('m ago')
                    ? 'linear-gradient(90deg, var(--color-pink) 0%, var(--color-purple) 100%)'
                    : 'var(--color-bg-tertiary)'
                }} />

                {/* Media Preview - Video */}
                {item.hasVideo && item.videoUrl && (
                  <div 
                    className="news-media-preview" 
                    style={{
                      position: 'relative',
                      display: 'block',
                      height: '180px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                      overflow: 'hidden'
                    }}
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}

                    {/* Unified Hover Overlay */}
                    <div className="media-overlay">
                       <button 
                        className="preview-indicator"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingItem?.({
                            ...item,
                            type: 'video',
                            url: item.videoUrl
                          });
                        }}
                      >
                        <Eye size={20} />
                        <span>Quick Preview</span>
                      </button>
                    </div>

                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      pointerEvents: 'none'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <PlayCircle size={36} style={{ color: '#000' }} />
                      </div>
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '4px 10px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: 'white',
                      zIndex: 2
                    }}>
                      VIDEO
                    </div>
                  </div>
                )}

                {/* Media Preview - Image (only if no video) */}
                {!item.hasVideo && item.hasImage && item.imageUrl && (
                  <div className="news-media-preview" style={{
                    position: 'relative',
                    height: '180px',
                    background: 'var(--color-bg-tertiary)',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                    
                    {/* Unified Hover Overlay */}
                    <div className="media-overlay">
                       <button 
                        className="preview-indicator"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingItem?.({
                            ...item,
                            type: 'image',
                            url: item.imageUrl
                          });
                        }}
                      >
                        <Eye size={20} />
                        <span>Quick Preview</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div style={{ padding: '16px' }}>
                  {/* Meta Row */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: '12px',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                      }}>
                        <SourceIcon size={12} />
                        {item.source}
                      </span>
                      {(item.time === 'Just now' || item.time?.includes('m ago')) && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          background: 'rgba(236, 72, 153, 0.2)',
                          borderRadius: '12px',
                          color: 'var(--color-pink)',
                          fontWeight: '600',
                          fontSize: '0.7rem'
                        }}>
                          <span className="live-pulse-dot" />
                          NEW
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {item.time}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ 
                    fontSize: '1.05rem', 
                    fontWeight: '600', 
                    marginBottom: '10px',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: isExpanded ? 'visible' : 'hidden'
                  }}>
                    {item.title}
                  </h3>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          padding: '2px 8px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          borderRadius: '8px',
                          color: 'var(--color-purple)',
                          fontSize: '0.7rem',
                          fontWeight: '500'
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'unset' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: isExpanded ? 'visible' : 'hidden'
                  }}>
                    {item.content}
                  </p>

                  {/* Actions */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px'
                  }}>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-purple)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}
                    >
                      {isExpanded ? (
                        <>Show Less <ChevronUp size={16} /></>
                      ) : (
                        <>Read More <ChevronRight size={16} /></>
                      )}
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleSave(item.id)}
                        title={isSaved ? 'Unsave' : 'Save'}
                        style={{
                          background: isSaved ? 'rgba(139, 92, 246, 0.2)' : 'var(--color-bg-tertiary)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                          color: isSaved ? 'var(--color-purple)' : 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleShare(item)}
                        title="Share"
                        style={{
                          background: 'var(--color-bg-tertiary)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <Share2 size={16} />
                      </button>
                      {item.url && (
                        <button
                          onClick={() => window.open(item.url, '_blank')}
                          title="Open Article"
                          style={{
                            background: 'var(--color-bg-tertiary)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Loading / Load More */}
      {isLoadingNews && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px',
          padding: '32px',
          color: 'var(--text-secondary)'
        }}>
          <RefreshCw size={20} className="spin-animation" />
          <span>Loading more news...</span>
        </div>
      )}

      {!isLoadingNews && hasMoreNews && (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <button className="cta-button-secondary" onClick={onLoadMore}>
            Load More Stories
          </button>
        </div>
      )}

      <style>{`
        .live-pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--color-pink);
          border-radius: 50%;
          animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .news-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }
        @media (max-width: 768px) {
          .news-hub-v2 .stagger-children {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default NewsHub;
