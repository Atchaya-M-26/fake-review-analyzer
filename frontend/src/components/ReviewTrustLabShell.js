import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './ReviewTrustLabShell.css';

function ReviewTrustLabShell({
  user,
  onLogout,
  headerTitle,
  headerSubtitle,
  sidebarItems = [],
  activeSidebarKey,
  primaryAction,
  secondaryActions = [],
  sidebarFooter,
  children,
  rightRail,
}) {
  const location = useLocation();

  const renderNavItem = (item, itemClassName) => {
    const isActive = item.key && item.key === activeSidebarKey;
    const className = `${itemClassName} ${isActive ? 'active' : ''}`;

    if (item.type === 'button') {
      return (
        <button key={item.key || item.label} type="button" className={className} onClick={item.onClick}>
          {item.label}
        </button>
      );
    }

    if (item.type === 'anchor') {
      const href = item.href || '#';
      return (
        <a key={item.key || item.label} href={href} className={className}>
          {item.label}
        </a>
      );
    }

    return (
      <Link key={item.key || item.label} to={item.to} className={className}>
        {item.label}
      </Link>
    );
  };

  const profileName = user?.username || 'Guest analyst';
  const profileMeta = user?.email || 'Sign in to sync dashboard data';
  const avatarLetter = profileName.slice(0, 1).toUpperCase();

  return (
    <div className="rtl-page">
      <div className="rtl-shell">
        <aside className="rtl-sidebar">
          <div className="rtl-brand">
            <div className="rtl-brand-mark" aria-hidden="true">
              <span>◈</span>
            </div>
            <div>
              <h2>Review Trust Lab</h2>
              <p>Fake Review Analyzer</p>
            </div>
          </div>

          <nav className="rtl-sidebar-nav" aria-label="Primary sidebar">
            {sidebarItems.map((item) => renderNavItem(item, 'rtl-sidebar-link'))}
          </nav>

          <div className="rtl-profile-card">
            <div className="rtl-profile-avatar">{avatarLetter}</div>
            <strong>{profileName}</strong>
            <span>{profileMeta}</span>
            <div className="rtl-profile-status">
              <span>{location.pathname === '/analyzer' ? 'Review analysis' : 'Dashboard access'}</span>
            </div>
          </div>

          {sidebarFooter && (
            <div className="rtl-sidebar-footer">
              <p className="rtl-sidebar-footer-kicker">{sidebarFooter.kicker}</p>
              <h3>{sidebarFooter.title}</h3>
              <span>{sidebarFooter.subtitle}</span>
              {sidebarFooter.action && (
                <div className="rtl-sidebar-footer-actions">
                  {sidebarFooter.action.to ? (
                    <Link to={sidebarFooter.action.to} className="rtl-sidebar-footer-button">
                      {sidebarFooter.action.label}
                    </Link>
                  ) : (
                    <button type="button" onClick={sidebarFooter.action.onClick} className="rtl-sidebar-footer-button">
                      {sidebarFooter.action.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        <section className="rtl-main-shell">
          <header className="rtl-header">
            <div className="rtl-header-copy">
              <p className="rtl-eyebrow">{headerTitle}</p>
              <h1>{headerSubtitle}</h1>
            </div>

            <div className="rtl-header-actions">
              {secondaryActions.map((action) => renderNavItem(action, 'rtl-header-chip'))}
              {primaryAction &&
                (primaryAction.to ? (
                  <Link to={primaryAction.to} className="rtl-primary-action">
                    {primaryAction.label}
                  </Link>
                ) : (
                  <button type="button" onClick={primaryAction.onClick} className="rtl-primary-action">
                    {primaryAction.label}
                  </button>
                ))}

              {onLogout && (
                <button type="button" className="rtl-icon-button rtl-logout-button" onClick={onLogout}>
                  Logout
                </button>
              )}
            </div>
          </header>

          <div className={`rtl-body ${rightRail ? '' : 'rtl-body-full'}`}>
            <main className="rtl-content">{children}</main>
            {rightRail && <aside className="rtl-right-rail">{rightRail}</aside>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReviewTrustLabShell;