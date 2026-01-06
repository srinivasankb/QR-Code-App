import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { 
  Download, RefreshCcw, Settings, Palette, Link, Type, Wifi, Mail, Contact, 
  Info, Shapes, Image as ImageIcon, History, Trash2, ArrowRight, AlertCircle
} from 'lucide-react';
import { QRConfig, DEFAULT_QR_CONFIG, DotType, CornerSquareType, CornerDotType, HistoryItem } from '../types';
import { saveToHistory, getHistory, clearHistory } from '../utils/storage';

type Tab = 'link' | 'text' | 'email' | 'wifi' | 'vcard';
type DesignTab = 'shapes' | 'colors' | 'logo';

const PRESETS: { name: string; config: Partial<QRConfig> }[] = [
  { name: 'Classic', config: { dotType: 'square', cornerSquareType: 'square', cornerDotType: 'square', bgColor: '#ffffff', fgColor: '#000000', cornerSquareColor: '#000000', cornerDotColor: '#000000' } },
  { name: 'Modern', config: { dotType: 'dots', cornerSquareType: 'extra-rounded', cornerDotType: 'dot', bgColor: '#ffffff', fgColor: '#2563eb', cornerSquareColor: '#2563eb', cornerDotColor: '#2563eb' } },
  { name: 'Soft', config: { dotType: 'rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot', bgColor: '#ffffff', fgColor: '#475569', cornerSquareColor: '#475569', cornerDotColor: '#475569' } },
  { name: 'Eco', config: { dotType: 'classy', cornerSquareType: 'extra-rounded', cornerDotType: 'dot', bgColor: '#f0fdf4', fgColor: '#166534', cornerSquareColor: '#166534', cornerDotColor: '#166534' } },
];

export const QRCodeEditor: React.FC = () => {
  const [config, setConfig] = useState<QRConfig>(DEFAULT_QR_CONFIG);
  const [activeTab, setActiveTab] = useState<Tab>('link');
  const [activeDesignTab, setActiveDesignTab] = useState<DesignTab>('shapes');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [qrError, setQrError] = useState<string | null>(null);
  
  const qrCode = useRef<QRCodeStyling | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState('https://example.com');
  const [text, setText] = useState('Hello World');
  const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' as 'WPA' | 'WEP' | 'nopass', hidden: false });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [vcard, setVcard] = useState({
    firstName: '', lastName: '', mobile: '', email: '',
    company: '', job: '', website: '', street: '', city: '', zip: '', country: ''
  });

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    let newVal = '';
    switch (activeTab) {
      case 'link': newVal = url; break;
      case 'text': newVal = text; break;
      case 'wifi': newVal = `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden};;`; break;
      case 'email': newVal = `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`; break;
      case 'vcard': newVal = `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName};${vcard.firstName};;;\nFN:${vcard.firstName} ${vcard.lastName}\nORG:${vcard.company}\nTITLE:${vcard.job}\nTEL;TYPE=CELL:${vcard.mobile}\nEMAIL:${vcard.email}\nURL:${vcard.website}\nADR:;;${vcard.street};${vcard.city};;${vcard.zip};${vcard.country}\nEND:VCARD`; break;
    }
    setConfig(c => ({ ...c, value: newVal }));
  }, [activeTab, url, text, wifi, email, vcard]);

  useEffect(() => {
    qrCode.current = new QRCodeStyling({
      width: 300,
      height: 300,
      imageOptions: { crossOrigin: 'anonymous', margin: 10 }
    });

    if (ref.current) {
      qrCode.current.append(ref.current);
    }
  }, []);

  useEffect(() => {
    if (!qrCode.current) return;

    const timeoutId = setTimeout(() => {
      try {
        qrCode.current?.update({
          data: config.value,
          width: 300, 
          height: 300, 
          margin: config.quietZone,
          image: config.logoUrl || undefined,
          dotsOptions: {
            color: config.fgColor,
            type: config.dotType as any
          },
          backgroundOptions: {
            color: config.bgColor,
          },
          cornersSquareOptions: {
            color: config.cornerSquareColor,
            type: config.cornerSquareType as any
          },
          cornersDotOptions: {
            color: config.cornerDotColor,
            type: config.cornerDotType as any
          },
          imageOptions: {
            crossOrigin: 'anonymous',
            margin: 0,
            imageSize: config.logoSize
          },
          qrOptions: {
            errorCorrectionLevel: config.ecLevel
          }
        });
        setQrError(null);
      } catch (err) {
        setQrError("The content is too large for the selected configuration. Try reducing text length or changing error correction level.");
      }
    }, 100); 

    return () => clearTimeout(timeoutId);
  }, [config]);

  const handleInputChange = useCallback((field: keyof QRConfig, value: any) => {
    setConfig((prev) => {
      const newConfig = { ...prev, [field]: value };
      if (field === 'logoUrl' && value) {
        newConfig.ecLevel = 'H';
      }
      return newConfig;
    });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleInputChange('logoUrl', reader.result as string);
        handleInputChange('ecLevel', 'H');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async (extension: 'png' | 'svg' | 'jpeg') => {
    if (qrCode.current && !qrError) {
      try {
        await qrCode.current.download({
          extension,
          name: `qrcode-${Date.now()}`
        });
        
        const typeName = tabs.find(t => t.id === activeTab)?.label || 'QR';
        let name = 'QR Code';
        if (activeTab === 'link') name = url;
        else if (activeTab === 'wifi') name = wifi.ssid;
        else if (activeTab === 'vcard') name = `${vcard.firstName} ${vcard.lastName}`;
        
        const newHistory = saveToHistory(config, typeName, name.substring(0, 20));
        setHistory(newHistory);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setConfig(item.config);
    if (item.config.value.startsWith('http')) { setActiveTab('link'); setUrl(item.config.value); }
    else if (item.config.value.startsWith('WIFI')) { setActiveTab('wifi'); } 
    // Basic restoration of tab content based on type could be expanded here if needed
  };

  const resetConfig = () => {
    setConfig(c => ({
      ...DEFAULT_QR_CONFIG,
      value: c.value
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    setQrError(null);
  };

  const applyPreset = (presetConfig: Partial<QRConfig>) => {
    setConfig(prev => ({ ...prev, ...presetConfig }));
  };

  const tabs: { id: Tab; icon: React.FC<any>; label: string }[] = [
    { id: 'link', icon: Link, label: 'Link' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'wifi', icon: Wifi, label: 'WiFi' },
    { id: 'email', icon: Mail, label: 'Email' },
    { id: 'vcard', icon: Contact, label: 'VCard' },
  ];

  const designTabs: { id: DesignTab; icon: React.FC<any>; label: string }[] = [
    { id: 'shapes', icon: Shapes, label: 'Shapes' },
    { id: 'colors', icon: Palette, label: 'Colors' },
    { id: 'logo', icon: ImageIcon, label: 'Logo' },
  ];

  const inputClasses = "w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black transition-all outline-none";
  const labelClasses = "block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2";

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start relative">
      
      {/* Left Column - Input & Design */}
      <div className="w-full lg:w-2/3 space-y-8">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-5 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-sm ring-1 ring-black/5'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-tight">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 'link' && (
              <div>
                <label className={labelClasses}>Website URL</label>
                <input 
                  type="url" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  className={inputClasses} 
                  placeholder="https://example.com"
                  maxLength={2048}
                />
              </div>
            )}
            {activeTab === 'text' && (
              <div>
                <label className={labelClasses}>Content</label>
                <textarea 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  rows={4} 
                  className={inputClasses}
                  maxLength={2500}
                />
              </div>
            )}
            {activeTab === 'wifi' && (
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>SSID</label>
                  <input 
                    type="text" 
                    value={wifi.ssid} 
                    onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} 
                    className={inputClasses} 
                    maxLength={32}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Password</label>
                    <input 
                      type="text" 
                      value={wifi.password} 
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })} 
                      className={inputClasses}
                      maxLength={64}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Encryption</label>
                    <select value={wifi.encryption} onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as any })} className={inputClasses}>
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={wifi.hidden} onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })} className="rounded text-black focus:ring-black" />
                  <span className="text-sm text-gray-700">Hidden Network</span>
                </label>
              </div>
            )}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Email</label>
                  <input 
                    type="email" 
                    value={email.to} 
                    onChange={(e) => setEmail({ ...email, to: e.target.value })} 
                    className={inputClasses} 
                    maxLength={320}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Subject</label>
                  <input 
                    type="text" 
                    value={email.subject} 
                    onChange={(e) => setEmail({ ...email, subject: e.target.value })} 
                    className={inputClasses} 
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Message</label>
                  <textarea 
                    value={email.body} 
                    onChange={(e) => setEmail({ ...email, body: e.target.value })} 
                    rows={3} 
                    className={inputClasses} 
                    maxLength={1000}
                  />
                </div>
              </div>
            )}
            {activeTab === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelClasses}>First Name</label><input type="text" value={vcard.firstName} onChange={(e) => setVcard({...vcard, firstName: e.target.value})} className={inputClasses} maxLength={50} /></div>
                <div><label className={labelClasses}>Last Name</label><input type="text" value={vcard.lastName} onChange={(e) => setVcard({...vcard, lastName: e.target.value})} className={inputClasses} maxLength={50} /></div>
                <div><label className={labelClasses}>Mobile</label><input type="tel" value={vcard.mobile} onChange={(e) => setVcard({...vcard, mobile: e.target.value})} className={inputClasses} maxLength={50} /></div>
                <div><label className={labelClasses}>Email</label><input type="email" value={vcard.email} onChange={(e) => setVcard({...vcard, email: e.target.value})} className={inputClasses} maxLength={320} /></div>
                <div className="sm:col-span-2"><label className={labelClasses}>Company</label><input type="text" value={vcard.company} onChange={(e) => setVcard({...vcard, company: e.target.value})} className={inputClasses} maxLength={100} /></div>
                <div className="sm:col-span-2"><label className={labelClasses}>Job Title</label><input type="text" value={vcard.job} onChange={(e) => setVcard({...vcard, job: e.target.value})} className={inputClasses} maxLength={100} /></div>
                <div className="sm:col-span-2"><label className={labelClasses}>Website</label><input type="url" value={vcard.website} onChange={(e) => setVcard({...vcard, website: e.target.value})} className={inputClasses} maxLength={2048} /></div>
                <div className="sm:col-span-2"><label className={labelClasses}>Street</label><input type="text" value={vcard.street} onChange={(e) => setVcard({...vcard, street: e.target.value})} className={inputClasses} maxLength={100} /></div>
                <div><label className={labelClasses}>City</label><input type="text" value={vcard.city} onChange={(e) => setVcard({...vcard, city: e.target.value})} className={inputClasses} maxLength={50} /></div>
                <div><label className={labelClasses}>Zip Code</label><input type="text" value={vcard.zip} onChange={(e) => setVcard({...vcard, zip: e.target.value})} className={inputClasses} maxLength={20} /></div>
                <div className="sm:col-span-2"><label className={labelClasses}>Country</label><input type="text" value={vcard.country} onChange={(e) => setVcard({...vcard, country: e.target.value})} className={inputClasses} maxLength={50} /></div>
              </div>
            )}
          </div>
        </div>

        {/* Customization */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {designTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDesignTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  activeDesignTab === tab.id ? 'bg-white border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
          
          <div className="p-6">
            {/* Presets Row */}
            <div className="mb-8 overflow-x-auto pb-2">
              <label className={labelClasses}>Quick Presets</label>
              <div className="flex gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.config)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors whitespace-nowrap"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {activeDesignTab === 'shapes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                   <label className={labelClasses}>Body Shape</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'].map(type => (
                       <button
                         key={type}
                         onClick={() => handleInputChange('dotType', type)}
                         className={`p-2 border rounded-md text-[10px] capitalize ${config.dotType === type ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-300'}`}
                       >
                         {type.replace('-', ' ')}
                       </button>
                     ))}
                   </div>
                 </div>
                 <div>
                   <label className={labelClasses}>Corner Frame</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['square', 'dot', 'extra-rounded'].map(type => (
                       <button
                         key={type}
                         onClick={() => handleInputChange('cornerSquareType', type)}
                         className={`p-2 border rounded-md text-[10px] capitalize ${config.cornerSquareType === type ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-300'}`}
                       >
                         {type.replace('-', ' ')}
                       </button>
                     ))}
                   </div>
                   <label className={`${labelClasses} mt-4`}>Corner Dot</label>
                   <div className="grid grid-cols-2 gap-2">
                     {['square', 'dot'].map(type => (
                       <button
                         key={type}
                         onClick={() => handleInputChange('cornerDotType', type)}
                         className={`p-2 border rounded-md text-[10px] capitalize ${config.cornerDotType === type ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-300'}`}
                       >
                         {type}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>
            )}

            {activeDesignTab === 'colors' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Background</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={config.bgColor} onChange={(e) => handleInputChange('bgColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                      <span className="text-xs text-gray-500 font-mono">{config.bgColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Dots Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={config.fgColor} onChange={(e) => handleInputChange('fgColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                      <span className="text-xs text-gray-500 font-mono">{config.fgColor}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className={labelClasses}>Corner Frame</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={config.cornerSquareColor} onChange={(e) => handleInputChange('cornerSquareColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                      <span className="text-xs text-gray-500 font-mono">{config.cornerSquareColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Corner Dot</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={config.cornerDotColor} onChange={(e) => handleInputChange('cornerDotColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                      <span className="text-xs text-gray-500 font-mono">{config.cornerDotColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDesignTab === 'logo' && (
              <div className="space-y-6">
                 <div>
                    <label className={labelClasses}>Upload Logo</label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-colors" />
                 </div>
                 {config.logoUrl && (
                   <>
                     <div>
                       <div className="flex justify-between items-center mb-1"><label className={labelClasses}>Logo Size</label><span className="text-[10px] text-gray-400">{(config.logoSize * 100).toFixed(0)}%</span></div>
                       <input type="range" min="0.1" max="0.5" step="0.05" value={config.logoSize} onChange={(e) => handleInputChange('logoSize', parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                     </div>
                     <div className="flex justify-between">
                       <button onClick={() => handleInputChange('logoUrl', null)} className="text-xs text-red-500 hover:underline">Remove Logo</button>
                     </div>
                   </>
                 )}
                 <div className="bg-blue-50 p-3 rounded-lg flex gap-2">
                   <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                   <p className="text-xs text-blue-700">Logos work best with High error correction and contrasting colors.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Preview & History */}
      <div className="w-full lg:w-1/3 space-y-6 lg:sticky lg:top-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
            <h3 className="font-medium flex items-center gap-2"><RefreshCcw className="w-4 h-4 text-gray-400" /> Live Preview</h3>
            <button onClick={resetConfig} className="text-xs text-gray-400 hover:text-white transition-colors">Reset</button>
          </div>
          
          <div className="p-8 flex flex-col items-center justify-center bg-gray-50 min-h-[340px]">
             {qrError ? (
                <div className="text-center p-6 bg-red-50 rounded-xl border border-red-100 max-w-[280px]">
                    <div className="text-red-500 mb-3 flex justify-center">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-red-700 mb-1">Generation Failed</p>
                    <p className="text-xs text-red-600 leading-relaxed">{qrError}</p>
                </div>
            ) : (
                <div ref={ref} className="bg-white p-4 shadow-sm border border-gray-100 rounded-xl" />
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 space-y-3">
             <button 
                onClick={() => handleDownload('png')} 
                disabled={!!qrError}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium shadow-sm transition-all text-sm ${qrError ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800 text-white'}`}
             >
                <Download className="w-4 h-4" /> Download PNG
             </button>
             <div className="grid grid-cols-2 gap-3">
               <button 
                  onClick={() => handleDownload('jpeg')} 
                  disabled={!!qrError}
                  className={`flex items-center justify-center gap-2 border border-gray-200 py-2.5 px-4 rounded-xl font-medium transition-all text-xs ${qrError ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                >
                  <Download className="w-3 h-3" /> JPG
               </button>
               <button 
                  onClick={() => handleDownload('svg')} 
                  disabled={!!qrError}
                  className={`flex items-center justify-center gap-2 border border-gray-200 py-2.5 px-4 rounded-xl font-medium transition-all text-xs ${qrError ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-700'}`}
                >
                  <Download className="w-3 h-3" /> SVG
               </button>
             </div>
          </div>
        </div>

        {/* History / Advanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
             <div className="flex items-center gap-2">
               <History className="w-4 h-4 text-gray-700" />
               <h3 className="font-semibold text-gray-900 text-sm">History</h3>
             </div>
             {history.length > 0 && <button onClick={() => { clearHistory(); setHistory([]); }} className="text-[10px] text-red-500 hover:underline">Clear</button>}
          </div>
          <div className="max-h-60 overflow-y-auto">
             {history.length === 0 ? (
               <div className="p-6 text-center text-gray-400 text-xs">Generated codes will appear here.</div>
             ) : (
               <div className="divide-y divide-gray-100">
                 {history.map(item => (
                   <button key={item.id} onClick={() => loadHistoryItem(item)} className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                     <div>
                       <p className="text-xs font-medium text-gray-900 truncate max-w-[180px]">{item.name}</p>
                       <p className="text-[10px] text-gray-500 uppercase">{item.type} • {new Date(item.date).toLocaleDateString()}</p>
                     </div>
                     <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-black" />
                   </button>
                 ))}
               </div>
             )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-4">
           <div className="flex items-center justify-between mb-2">
             <label className="text-xs font-semibold text-gray-600 uppercase">Quality</label>
             <span className="text-xs font-mono text-gray-400">{config.ecLevel}</span>
           </div>
           <select value={config.ecLevel} onChange={(e) => handleInputChange('ecLevel', e.target.value)} disabled={!!config.logoUrl} className="w-full text-sm border-gray-200 rounded-lg p-2 bg-gray-50">
             <option value="L">Low (7%)</option>
             <option value="M">Medium (15%)</option>
             <option value="Q">Quartile (25%)</option>
             <option value="H">High (30%)</option>
           </select>
        </div>

      </div>
    </div>
  );
};