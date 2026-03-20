
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp, SettingsView } from '../AppContext';
import { Icons } from '../constants';
import { ThemeMode, DisplaySize, ManagementView, LinkItem, JapanLinkItem } from '../types';

const TelegramGroup: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => (
  <div className="mb-6">
    {title && (
      <h2 className="px-5 mb-2 text-[13px] font-semibold text-[var(--accent)] uppercase tracking-tight opacity-90">
        {title}
      </h2>
    )}
    <div className="bg-[var(--surface)] overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
      {children}
    </div>
  </div>
);

const TelegramItem: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  isDestructive?: boolean;
}> = ({ icon, iconBg, title, description, rightElement, onClick, isDestructive }) => (
  <div
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-[var(--text-primary)]/[0.05] transition-colors text-left border-b border-[var(--border)] last:border-none outline-none tap-highlight-none ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div 
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
      style={{ backgroundColor: iconBg }}
    >
      <div className="w-5 h-5 text-white flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-[15px] font-medium leading-tight truncate ${isDestructive ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
        {title}
      </div>
      {description && (
        <div className={`text-[13px] mt-0.5 truncate opacity-60 ${isDestructive ? 'text-rose-500/80' : 'text-[var(--text-muted)]'}`}>
          {description}
        </div>
      )}
    </div>
    <div className="shrink-0 flex items-center gap-2">
      {rightElement}
      {!rightElement && <div className="opacity-20"><Icons.ChevronRight /></div>}
    </div>
  </div>
);

const TelegramSelectionItem: React.FC<{
  label: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ label, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className="w-full flex items-center justify-between px-5 py-4 active:bg-[var(--text-primary)]/[0.05] transition-colors border-b border-[var(--border)] last:border-none outline-none tap-highlight-none cursor-pointer"
  >
    <span className={`text-[15px] transition-colors duration-200 ${isSelected ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-primary)] font-medium opacity-90'}`}>
      {label}
    </span>
    {isSelected && (
      <div className="text-[var(--accent)] flex items-center justify-center animate-slide-forward">
        <Icons.Check />
      </div>
    )}
  </div>
);

const Toggle: React.FC<{ 
  isActive: boolean; 
  onToggle: () => void 
}> = ({ isActive, onToggle }) => (
  <div
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 shrink-0 cursor-pointer ${isActive ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
  >
    <div 
      className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${isActive ? 'translate-x-6' : 'translate-x-0'}`} 
    />
  </div>
);

export const Settings: React.FC = () => {
  const { 
    state, updateSettings, 
    importData, runSystemCheck, 
    settingsView, setSettingsView
  } = useApp();
  const { settings } = state;
  const [transitionDir, setTransitionDir] = useState<'forward' | 'backward'>('forward');
  const [checkState, setCheckState] = useState<'idle' | 'scanning' | 'finished'>('idle');

  const navigateTo = useCallback((view: SettingsView) => {
    setTransitionDir('forward');
    setSettingsView(view);
    window.history.pushState({ settingsView: view }, '');
  }, [setSettingsView]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setTransitionDir('backward');
      const view = event.state?.settingsView || 'main';
      setSettingsView(view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setSettingsView]);

  const handleCheck = async () => {
    if (checkState === 'scanning') return;
    setCheckState('scanning');
    try {
      await runSystemCheck();
      setCheckState('finished');
      setTimeout(() => setCheckState('idle'), 3000);
    } catch (e) {
      setCheckState('idle');
    }
  };

  const animationClass = transitionDir === 'forward' ? 'animate-slide-forward' : 'animate-slide-backward';

  const themes: ThemeMode[] = ['Dark', 'Grey', 'Amoled', 'Blue', 'Light'];
  const pageSizes = [10, 20, 30, 50];
  const accentColors = ['#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#22c55e', '#f59e0b', '#06b6d4', '#f97316'];
  const circleColors = ['#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080', '#606060', '#404040', '#000000'];

  const renderContent = () => {
    switch (settingsView) {
      case 'main':
        return (
          <>
            <TelegramGroup title="General">
              <TelegramItem 
                icon={<Icons.Palette />} iconBg="#3b82f6"
                title="Appearance" description="Themes and accent colors"
                onClick={() => navigateTo('theme')}
              />
              <TelegramItem 
                icon={<Icons.Eye />} iconBg="#ec4899"
                title="Content Display" description="Blur and button styles"
                onClick={() => navigateTo('cover')}
              />
              <TelegramItem 
                icon={<Icons.Type />} iconBg="#94a3b8"
                title="Display Options" description="Text scaling and page limits"
                onClick={() => navigateTo('display')}
              />
            </TelegramGroup>

            <TelegramGroup title="Database & Storage">
              <TelegramItem 
                icon={<Icons.DataIcon />} iconBg="#22c55e"
                title="Data Management" description="Backup and recovery"
                onClick={() => navigateTo('data')}
              />
            </TelegramGroup>
          </>
        );

      case 'theme':
        return (
          <>
            <TelegramGroup title="Color Theme">
              {themes.map(t => (
                <TelegramSelectionItem key={t} label={t} isSelected={settings.theme === t} onClick={() => updateSettings({ theme: t })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Accent Color">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {accentColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ accentColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.accentColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ borderColor: color, boxShadow: `0 0 10px ${color}60` }}
                      />
                      {settings.accentColor === color && <div className="text-white scale-[0.5] drop-shadow-md"><Icons.Check /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>

            <TelegramGroup title="Circle Colour">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {circleColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ circleBorderColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0 border border-white/10"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.circleBorderColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ 
                          borderColor: ['#ffffff', '#e0e0e0', '#c0c0c0'].includes(color) ? '#a3a3a3' : (color === '#000000' ? '#525252' : color), 
                          boxShadow: !['#ffffff', '#e0e0e0', '#c0c0c0', '#000000'].includes(color) ? `0 0 8px ${color}40` : 'none' 
                        }}
                      />
                      {settings.circleBorderColor === color && (
                        <div className={`scale-[0.5] drop-shadow-md ${['#ffffff', '#e0e0e0'].includes(color) ? 'text-black' : 'text-white'}`}>
                          <Icons.Check />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>

            <TelegramGroup title="Button Colour">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {accentColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ buttonColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.buttonColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ borderColor: color, boxShadow: `0 0 10px ${color}60` }}
                      />
                      {settings.buttonColor === color && <div className="text-white scale-[0.5] drop-shadow-md"><Icons.Check /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>
          </>
        );

      case 'cover':
        return (
          <>
            <TelegramGroup title="Card Visuals">
              <div className="px-5 py-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[14px] font-medium">Blur Intensity</span>
                  <span className="text-[13px] font-bold text-[var(--accent)]">{settings.blurIntensity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={settings.blurIntensity} 
                  onChange={(e) => updateSettings({ blurIntensity: parseInt(e.target.value) })}
                  className="w-full accent-[var(--accent)] h-1 bg-[var(--border)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]"
                />
              </div>
            </TelegramGroup>

            <TelegramGroup title="Privacy">
              <TelegramItem 
                icon={<Icons.Eye />} iconBg="#ec4899"
                title="Blur Image Covers" description="Apply blur to all image covers"
                rightElement={<Toggle isActive={settings.blurCovers} onToggle={() => updateSettings({ blurCovers: !settings.blurCovers })} />}
              />
            </TelegramGroup>

            <TelegramGroup title="Actor Name Color">
              <div className="px-4 py-5 overflow-x-auto hide-scrollbar">
                <div className="flex items-center justify-between gap-2 min-w-full">
                  {accentColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => updateSettings({ actorNameColor: color })}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 relative shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 transition-all duration-300 pointer-events-none ${settings.actorNameColor === color ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ borderColor: color, boxShadow: `0 0 10px ${color}60` }}
                      />
                      {settings.accentColor === color && <div className="text-white scale-[0.5] drop-shadow-md"><Icons.Check /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </TelegramGroup>

            <TelegramGroup title="Button Style">
              <TelegramSelectionItem label="Glass (Minimal)" isSelected={settings.buttonStyle === 'Glass'} onClick={() => updateSettings({ buttonStyle: 'Glass' })} />
              <TelegramSelectionItem label="Vibrant Colors" isSelected={settings.buttonStyle === 'ColorGlass'} onClick={() => updateSettings({ buttonStyle: 'ColorGlass' })} />
              <TelegramSelectionItem label="Solid Colors" isSelected={settings.buttonStyle === 'SolidColors'} onClick={() => updateSettings({ buttonStyle: 'SolidColors' })} />
            </TelegramGroup>
          </>
        );

      case 'display':
        return (
          <>
            <TelegramGroup title="Actors Tags View">
              {(['List', 'Card'] as ManagementView[]).map(v => (
                <TelegramSelectionItem key={v} label={v} isSelected={settings.managementView === v} onClick={() => updateSettings({ managementView: v })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Visibility & Preview">
              <TelegramItem 
                icon={<Icons.Check />} iconBg="#3b82f6"
                title="Actor Checkmark" description="Show verification icon"
                rightElement={<Toggle isActive={settings.showActorCheckmark} onToggle={() => updateSettings({ showActorCheckmark: !settings.showActorCheckmark })} />}
              />
              <TelegramItem 
                icon={<Icons.GalleryIcon />} iconBg="#10b981"
                title="Gallery Cover Preview" description="Allow slide preview on stationary"
                rightElement={<Toggle isActive={settings.enableGalleryPreview} onToggle={() => updateSettings({ enableGalleryPreview: !settings.enableGalleryPreview })} />}
              />
            </TelegramGroup>

            <TelegramGroup title="Title Scaling">
              {(['Small', 'Medium', 'Large'] as DisplaySize[]).map(s => (
                <TelegramSelectionItem key={s} label={s} isSelected={settings.titleSize === s} onClick={() => updateSettings({ titleSize: s })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Metadata Scaling">
              {(['Small', 'Medium', 'Large'] as DisplaySize[]).map(s => (
                <TelegramSelectionItem key={s} label={s} isSelected={settings.metadataSize === s} onClick={() => updateSettings({ metadataSize: s })} />
              ))}
            </TelegramGroup>

            <TelegramGroup title="Pagination">
              {pageSizes.map(ps => (
                <TelegramSelectionItem key={ps} label={`${ps} items per page`} isSelected={settings.itemsPerPage === ps} onClick={() => updateSettings({ itemsPerPage: ps })} />
              ))}
            </TelegramGroup>
          </>
        );

      case 'data':
        return (
          <>
            <TelegramGroup title="Backup Actions">
              <TelegramItem 
                icon={<Icons.Download />} iconBg="#3b82f6"
                title="Export Backup" description="Save your database as a JSON file"
                onClick={() => {
                  const data = JSON.stringify(state, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `Vault_Backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
              />
              <TelegramItem 
                icon={<Icons.Upload />} iconBg="#22c55e"
                title="Import Backup" description="Restore from a JSON file"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file'; input.accept = '.json';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (importData(ev.target?.result as string)) alert('Import Successful');
                        else alert('Import Failed: Invalid JSON');
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              />
            </TelegramGroup>

            <TelegramGroup title="Database Maintenance">
              <TelegramItem 
                icon={
                  checkState === 'finished' ? <Icons.Check /> : 
                  checkState === 'scanning' ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 
                  <Icons.SearchIcon />
                } 
                iconBg={checkState === 'finished' ? '#22c55e' : checkState === 'scanning' ? '#3b82f6' : '#94a3b8'}
                title="Check" 
                description={
                  checkState === 'scanning' ? 'Scanning database...' : 
                  checkState === 'finished' ? 'Scan complete!' : 
                  'Perform global sync of unassigned actors/tags'
                }
                onClick={handleCheck}
                rightElement={
                  checkState === 'scanning' ? (
                    <div className="w-12 h-4 bg-white/5 rounded overflow-hidden relative">
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1s_infinite]" />
                    </div>
                  ) : null
                }
              />
            </TelegramGroup>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div key={settingsView} className={`w-full flex flex-col pb-32 ${animationClass} px-2 pt-2 gpu-accelerated contain-layout`}>
      {renderContent()}
    </div>
  );
};
