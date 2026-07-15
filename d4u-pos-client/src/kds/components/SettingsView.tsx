import React from 'react';
import { Settings, Volume2, ShieldAlert, BadgeInfo, Play, Cpu, Sparkles, Lock } from 'lucide-react';
import type { StationSettings } from '../types';
import { playNewOrderAlert, playReadyAlert, playEmergencyAlert } from '../utils/audio';

interface SettingsProps {
  settings: StationSettings;
  updateSettings: (s: Partial<StationSettings>) => void;
  readOnly?: boolean;
}

export default function SettingsView({
  settings,
  updateSettings,
  readOnly = false
}: SettingsProps) {

  const handleTestAudio = () => {
    if (settings.alarmSoundEnabled) {
      playNewOrderAlert(settings.volume);
    }
  };

  const handleTestReadyChime = () => {
    if (settings.alarmSoundEnabled) {
      playReadyAlert(settings.volume);
    }
  };

  const avatarsPresets = [
    { name: 'Standard Chef #1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBK3tYdWIHrzS35gXN_e8OLTGDFtifxhEFCdElswQsgA3zZcvfGAOI5w3O0f_7BFo6y2bJQDhHlU2rWyvDeAcavaiwRoee-s8XQYp1dqFualqFn76rC7mEaFMZ_I3_IcKMFBbtvGNoXiFlNwf0XM3_NztGSmdFyjyp8AC7gFwMoQsOAsF5-5_35OLAeWTDZle1FF65Ham_uNnxWrZUQNsAPEqP4pTwt9puEmyA1DJsGvHb3U6Qv7vTQwBfkOGeBsLk2HfBZfuz7wzg' },
    { name: 'Sushi Master #2', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80' },
    { name: 'Baker Queen #3', url: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=150&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0c1322] select-none text-[#dce2f7]">
      
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-[#dce2f7] flex items-center gap-2">
          <Settings className="w-7 h-7 text-brand-yellow" />
          <span>Kitchen Terminal Configurations</span>
          {readOnly && <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs uppercase tracking-wider font-bold border border-slate-700 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>}
        </h2>
        <p className="text-[#d3c5ac] text-xs font-mono mt-1">
          Adjust cooking durations, simulation triggers, acoustic frequencies and chef profile states.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Profile Card Section */}
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl space-y-4 shadow-lg">
          <h3 className="text-sm font-mono font-bold text-[#d3c5ac] uppercase tracking-wider flex items-center gap-2 border-b border-[#4f4633]/20 pb-2.5">
            <Cpu className="w-4 h-4 text-brand-yellow" />
            <span>Chef Station Setup</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#d3c5ac] mb-1 uppercase">
                Terminal Name
              </label>
              <input 
                type="text" 
                value={settings.stationName}
                onChange={(e) => updateSettings({ stationName: e.target.value })}
                disabled={readOnly}
                className="w-full bg-[#0c1322] border border-[#4f4633]/40 rounded-xl px-4 py-2 text-sm text-[#dce2f7] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#d3c5ac] mb-1 uppercase">
                Specialty focus
              </label>
              <input 
                type="text" 
                value={settings.specialtyName}
                onChange={(e) => updateSettings({ specialtyName: e.target.value })}
                disabled={readOnly}
                className="w-full bg-[#0c1322] border border-[#4f4633]/40 rounded-xl px-4 py-2 text-sm text-[#dce2f7] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#d3c5ac] mb-2 uppercase">
                Choose Station Avatar
              </label>
              <div className="flex gap-4 items-center">
                <img 
                  className="w-16 h-16 rounded-full border-2 border-brand-yellow object-cover shrink-0"
                  src={settings.chefAvatar}
                  alt="Current Avatar"
                />
                
                <div className="flex flex-wrap gap-2">
                  {avatarsPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateSettings({ chefAvatar: preset.url })}
                      disabled={readOnly}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
                        settings.chefAvatar === preset.url
                          ? 'bg-brand-yellow text-[#261a00] border-brand-yellow font-bold'
                          : 'bg-[#0c1322] text-[#dce2f7] border-[#4f4633]/30 hover:border-brand-yellow/50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sound Controls Section */}
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl space-y-4 shadow-lg">
          <h3 className="text-sm font-mono font-bold text-[#d3c5ac] uppercase tracking-wider flex items-center gap-2 border-b border-[#4f4633]/20 pb-2.5">
            <Volume2 className="w-4 h-4 text-brand-green" />
            <span>Tone & Acoustics</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-display font-semibold font-bold">Acoustic Audio Alarm</span>
                <p className="text-[10px] text-[#d3c5ac]/70">Triggers synthesized chimes on transactions</p>
              </div>
              <input 
                type="checkbox"
                checked={settings.alarmSoundEnabled}
                onChange={(e) => updateSettings({ alarmSoundEnabled: e.target.checked })}
                className="w-5 h-5 rounded hover:bg-[#2d3545] text-brand-yellow focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-display font-semibold font-bold">Silent New-Order Popups</span>
                <p className="text-[10px] text-[#d3c5ac]/70">Suppress buzzer alarms on incoming overlays</p>
              </div>
              <input 
                type="checkbox"
                checked={settings.silentAlert}
                onChange={(e) => updateSettings({ silentAlert: e.target.checked })}
                className="w-5 h-5 rounded hover:bg-[#2d3545] text-brand-yellow focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
                <span>Synthesizer Master Volume</span>
                <span className="text-brand-yellow font-bold">{settings.volume}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
                className="w-full h-1.5 bg-[#0c1322] rounded-lg appearance-none cursor-pointer accent-brand-yellow"
              />
            </div>

            {/* Test buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestAudio}
                className="flex-1 py-2 px-3 bg-[#2a2618] hover:bg-[#3d3722] border border-brand-yellow/30 text-brand-yellow rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center"
              >
                TEST NEW-ORDER CHIME
              </button>
              <button
                type="button"
                onClick={handleTestReadyChime}
                className="flex-1 py-2 px-3 bg-[#133126] hover:bg-[#1a4435] border border-brand-green/30 text-brand-green rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center"
              >
                TEST COMPLETED BELL
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Settings Section */}
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl space-y-4 shadow-lg">
          <h3 className="text-sm font-mono font-bold text-[#d3c5ac] uppercase tracking-wider flex items-center gap-2 border-b border-[#4f4633]/20 pb-2.5">
            <Cpu className="w-4 h-4 text-brand-yellow" />
            <span>Simulation Engine</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-display font-semibold font-bold">Auto-Simulate Orders</span>
                <p className="text-[10px] text-[#d3c5ac]/70">Pushes randomized client tickets onto the board automatically</p>
              </div>
              <input 
                type="checkbox"
                checked={settings.autoSimulate}
                onChange={(e) => updateSettings({ autoSimulate: e.target.checked })}
                className="w-5 h-5 rounded hover:bg-[#2d3545] text-brand-yellow focus:ring-0 cursor-pointer"
              />
            </div>

            {settings.autoSimulate && (
              <div className="space-y-1 animate-scale-up">
                <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
                  <span>Simulator Frequency Rate</span>
                  <span className="text-brand-yellow font-bold">{settings.simulateIntervalSeconds} seconds</span>
                </div>
                <input 
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={settings.simulateIntervalSeconds}
                  onChange={(e) => updateSettings({ simulateIntervalSeconds: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#0c1322] rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                />
                <div className="flex justify-between text-[10px] text-[#d3c5ac]/40 font-mono">
                  <span>Fast Demo (15s)</span>
                  <span>Cook Pacing (120s)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cook Time Limits Section */}
        <div className="bg-[#191f2f] border border-[#4f4633]/20 p-5 rounded-xl space-y-4 shadow-lg">
          <h3 className="text-sm font-mono font-bold text-[#d3c5ac] uppercase tracking-wider flex items-center gap-2 border-b border-[#4f4633]/20 pb-2.5">
            <BadgeInfo className="w-4 h-4 text-[#d3c5ac]" />
            <span>Target Cook Durations</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#d3c5ac] mb-1 uppercase">
                Sandwich recipes (sec)
              </label>
              <input 
                type="number" 
                value={settings.standardBurgerPrepSeconds}
                onChange={(e) => updateSettings({ standardBurgerPrepSeconds: Number(e.target.value) })}
                className="w-full bg-[#0c1322] border border-[#4f4633]/40 rounded-xl px-4 py-2 text-sm text-[#dce2f7] outline-none font-mono"
              />
              <span className="text-[10px] text-brand-yellow font-mono mt-1 block">
                ≈ {Math.round(settings.standardBurgerPrepSeconds / 60)} minutes
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#d3c5ac] mb-1 uppercase">
                Side portions (sec)
              </label>
              <input 
                type="number" 
                value={settings.standardSidesPrepSeconds}
                onChange={(e) => updateSettings({ standardSidesPrepSeconds: Number(e.target.value) })}
                className="w-full bg-[#0c1322] border border-[#4f4633]/40 rounded-xl px-4 py-2 text-sm text-[#dce2f7] outline-none font-mono"
              />
              <span className="text-[10px] text-brand-yellow font-mono mt-1 block">
                ≈ {Math.round(settings.standardSidesPrepSeconds / 60)} minutes
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Emergency Stops documentation warning */}
      <div className="mt-8 bg-brand-darkred/15 border border-brand-red/30 p-5 rounded-xl flex gap-4 select-none items-start">
        <ShieldAlert className="w-6 h-6 text-brand-red shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="text-brand-red font-display font-bold text-sm tracking-wide uppercase">
            Emergency Stopper Protocol Instructions
          </h4>
          <p className="text-xs text-[#ffdad6] mt-1 leading-relaxed">
            Activating the **Emergency Stop** switch in the sidebar immediately triggers an audit shutdown signal. During shutdown, all running active cooking countdown clocks are securely frozen, automatic client simulation timers are suspended, and manual entries are locked. Simply click **RESUME ALL** on the side tab to safely resume operations.
          </p>
        </div>
      </div>

    </div>
  );
}
