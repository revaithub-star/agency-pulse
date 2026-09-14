'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, User, Calendar, Key, Server, FileText, Paperclip, Upload, Download, Trash2, Copy, Check, Eye, EyeOff, CalendarDays, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

export default function ProjectDetailsModal({ project, isOpen, onClose, onEdit }) {
  const [copiedField, setCopiedField] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState({});

  useEffect(() => {
    if (!isOpen || !project) return;
    fetch(`/api/attachments?projectId=${project.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setAttachments(Array.isArray(data) ? data : []))
      .catch(() => setAttachments([]));
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePasswordReveal = (key) => {
    setRevealedPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Determine source platform display
  const sourcePlatform = project.sourceType === 'online'
    ? (project.onlinePlatform || 'Online')
    : (project.offlinePerson ? `Referral: ${project.offlinePerson}` : 'Offline / Direct');

  // Hosting details
  const hostingServer = project.hostingDetails?.server || {};
  const hostingAccount = project.hostingDetails?.hosting || {};
  const hasServerDetails = hostingServer.serverName || hostingServer.ip || hostingServer.username;
  const hasHostingDetails = hostingAccount.provider || hostingAccount.domain || hostingAccount.username;
  const hasAnyHosting = hasServerDetails || hasHostingDetails;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl rounded-xl border border-border bg-card p-0 shadow-xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{project.projectName}</h2>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${project.status === 'Completed' ? 'border-transparent bg-green-500/15 text-green-600' :
                  project.status === 'In Progress' ? 'border-transparent bg-blue-500/15 text-blue-600' :
                    project.status === 'Cancelled' ? 'border-transparent bg-red-500/15 text-red-600' :
                      'border-transparent bg-secondary text-secondary-foreground'
                  }`}>
                  {project.status}
                </span>
              </div>
              {project.projectUrl && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1"
                >
                  <Globe size={14} /> {project.projectUrl}
                </a>
              )}
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Metadata Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/20 border border-border">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Amount</span>
                <p className="text-lg font-mono font-bold text-foreground mt-0.5">
                  {formatCurrency(project.amount, project.currency)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Category</span>
                <p className="text-sm font-medium text-foreground mt-1 truncate">
                  {project.category || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Source Platform</span>
                <p className="text-sm font-medium text-foreground mt-1 truncate">
                  {sourcePlatform}
                </p>
              </div>
            </div>

            {/* Project Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/10 border border-border">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1"><CalendarDays size={11} /> Record Date</span>
                <p className="text-sm font-medium text-foreground mt-1">
                  {formatDate(project.date) || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1"><CalendarDays size={11} /> Start Date</span>
                <p className="text-sm font-medium text-foreground mt-1">
                  {formatDate(project.startDate) || <span className="text-muted-foreground italic text-xs">Not set</span>}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1"><CalendarDays size={11} />
                  {project.status === 'In Progress' ? 'Expected End Date' : 'End Date'}
                </span>
                <p className="text-sm font-medium text-foreground mt-1">
                  {formatDate(project.endDate) || <span className="text-muted-foreground italic text-xs">Not set</span>}
                </p>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Key size={16} /> Client Credentials
              </h3>
              {(!project.credentials || project.credentials.length === 0) ? (
                <p className="text-xs text-muted-foreground italic">No credentials recorded for this project.</p>
              ) : (
                <div className="space-y-3">
                  {project.credentials.map((cred, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border bg-card/50 space-y-2 text-sm">
                      <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                        <span>{cred.serviceName ? `🔑 ${cred.serviceName}` : `Credential #${idx + 1}`}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cred.url && (
                          <div className="">
                            <span className="text-xs text-muted-foreground">URL / Details:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="truncate">{cred.url}</span>
                              <button onClick={() => copyToClipboard(cred.url, `cred-url-${idx}`)} className="text-muted-foreground hover:text-foreground">
                                {copiedField === `cred-url-${idx}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {cred.email && (
                          <div>
                            <span className="text-xs text-muted-foreground">Email:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="truncate">{cred.email}</span>
                              <button onClick={() => copyToClipboard(cred.email, `cred-e-${idx}`)} className="text-muted-foreground hover:text-foreground">
                                {copiedField === `cred-e-${idx}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {cred.username && (
                          <div>
                            <span className="text-xs text-muted-foreground">Username:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="truncate">{cred.username}</span>
                              <button onClick={() => copyToClipboard(cred.username, `cred-u-${idx}`)} className="text-muted-foreground hover:text-foreground">
                                {copiedField === `cred-u-${idx}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {cred.password && (
                          <div className="">
                            <span className="text-xs text-muted-foreground">Password:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="truncate select-none">
                                {revealedPasswords[`cred-p-${idx}`] ? cred.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordReveal(`cred-p-${idx}`)}
                                className="text-muted-foreground hover:text-foreground shrink-0 p-0.5"
                                title={revealedPasswords[`cred-p-${idx}`] ? 'Hide password' : 'Show password'}
                              >
                                {revealedPasswords[`cred-p-${idx}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                              {cred.password !== '[REDACTED]' && revealedPasswords[`cred-p-${idx}`] && (
                                <button onClick={() => copyToClipboard(cred.password, `cred-p-${idx}`)} className="text-muted-foreground hover:text-foreground shrink-0">
                                  {copiedField === `cred-p-${idx}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hosting Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Server size={16} /> Hosting / Server Details
              </h3>
              {!hasAnyHosting ? (
                <p className="text-xs text-muted-foreground italic">No hosting details recorded.</p>
              ) : (
                <div className="space-y-3">
                  {/* Server Details */}
                  {hasServerDetails && (
                    <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3 text-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Server / VPS</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {hostingServer.serverName && (
                          <div>
                            <span className="text-xs text-muted-foreground">Server Provider:</span>
                            <p className="font-medium text-xs mt-0.5">{hostingServer.serverName}</p>
                          </div>
                        )}
                        {hostingServer.ip && (
                          <div>
                            <span className="text-xs text-muted-foreground">IP Address:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span>{hostingServer.ip}</span>
                              <button onClick={() => copyToClipboard(hostingServer.ip, 'host-ip')} className="text-muted-foreground hover:text-foreground">
                                {copiedField === 'host-ip' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        {hostingServer.username && (
                          <div>
                            <span className="text-xs text-muted-foreground">Username:</span>
                            <p className="font-mono text-xs mt-0.5">{hostingServer.username}</p>
                          </div>
                        )}
                        {hostingServer.password && (
                          <div>
                            <span className="text-xs text-muted-foreground">Password:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="select-none">
                                {revealedPasswords['server-pass'] ? hostingServer.password : '••••••••'}
                              </span>
                              <button onClick={() => togglePasswordReveal('server-pass')} className="text-muted-foreground hover:text-foreground p-0.5" title={revealedPasswords['server-pass'] ? 'Hide' : 'Show'}>
                                {revealedPasswords['server-pass'] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                              {revealedPasswords['server-pass'] && (
                                <button onClick={() => copyToClipboard(hostingServer.password, 'server-pass-copy')} className="text-muted-foreground hover:text-foreground">
                                  {copiedField === 'server-pass-copy' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {hostingServer.notes && (
                        <div className="pt-2 border-t border-border/50 text-xs">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-0.5 whitespace-pre-wrap">{hostingServer.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hosting Account Details */}
                  {hasHostingDetails && (
                    <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3 text-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hosting Account</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {hostingAccount.provider && (
                          <div>
                            <span className="text-xs text-muted-foreground">Hosting Provider:</span>
                            <p className="font-medium text-xs mt-0.5">{hostingAccount.provider}</p>
                          </div>
                        )}
                        {hostingAccount.plan && (
                          <div>
                            <span className="text-xs text-muted-foreground">Plan / Package:</span>
                            <p className="font-mono text-xs mt-0.5">{hostingAccount.plan}</p>
                          </div>
                        )}
                        {hostingAccount.domain && (
                          <div>
                            <span className="text-xs text-muted-foreground">Domain Name:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="truncate">{hostingAccount.domain}</span>
                              <button onClick={() => copyToClipboard(hostingAccount.domain, 'host-domain')} className="text-muted-foreground hover:text-foreground">
                                {copiedField === 'host-domain' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        {hostingAccount.username && (
                          <div>
                            <span className="text-xs text-muted-foreground">Username:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span>{hostingAccount.username}</span>
                              <button onClick={() => copyToClipboard(hostingAccount.username, 'host-uname')} className="text-muted-foreground hover:text-foreground">
                                {copiedField === 'host-uname' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        {hostingAccount.password && (
                          <div>
                            <span className="text-xs text-muted-foreground">Password:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="select-none">
                                {revealedPasswords['hosting-pass'] ? hostingAccount.password : '••••••••'}
                              </span>
                              <button onClick={() => togglePasswordReveal('hosting-pass')} className="text-muted-foreground hover:text-foreground p-0.5" title={revealedPasswords['hosting-pass'] ? 'Hide' : 'Show'}>
                                {revealedPasswords['hosting-pass'] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                              {revealedPasswords['hosting-pass'] && (
                                <button onClick={() => copyToClipboard(hostingAccount.password, 'hosting-pass-copy')} className="text-muted-foreground hover:text-foreground">
                                  {copiedField === 'hosting-pass-copy' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {hostingAccount.notes && (
                        <div className="pt-2 border-t border-border/50 text-xs">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-0.5 whitespace-pre-wrap">{hostingAccount.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            {project.notes && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <FileText size={16} /> Additional Notes
                </h3>
                <div className="p-4 rounded-lg border border-border bg-card/50 text-xs leading-relaxed whitespace-pre-wrap">
                  {project.notes}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-between items-center bg-secondary/10 rounded-b-xl">
            <button
              onClick={() => { onClose(); onEdit(project); }}
              className="app-button app-button-primary"
            >
              Edit Project Details
            </button>
            <button onClick={onClose} className="app-button app-button-secondary">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
