'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, User, Calendar, Key, Server, FileText, Paperclip, Upload, Download, Trash2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';

export default function ProjectDetailsModal({ project, isOpen, onClose, onEdit }) {
  const [copiedField, setCopiedField] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!isOpen || !project) return;
    setUploadError('');
    // Fetch project attachments metadata
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('projectId', project.id);
      formData.append('file', file);

      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload attachment');
      }

      const newAttachment = await res.json();
      setAttachments(prev => [newAttachment, ...prev]);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (id) => {
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAttachments(prev => prev.filter(att => att.id !== id));
      }
    } catch (err) {
      console.error('Delete attachment error:', err);
    }
  };

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
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  project.status === 'Completed' ? 'border-transparent bg-green-500/15 text-green-600' :
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-secondary/20 border border-border">
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
                <span className="text-xs text-muted-foreground uppercase font-medium">Source</span>
                <p className="text-sm font-medium text-foreground mt-1 truncate">
                  {project.sourceType === 'online' ? project.onlinePlatform : `Ref: ${project.offlinePerson}`}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium">Date</span>
                <p className="text-sm font-medium text-foreground mt-1">
                  {(() => {
                    try {
                      return format(new Date(project.date), 'MMM dd, yyyy');
                    } catch {
                      return project.date || 'N/A';
                    }
                  })()}
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
                        <span>Credential #{idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        {cred.password && (
                          <div>
                            <span className="text-xs text-muted-foreground">Password:</span>
                            <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                              <span className="truncate">{cred.password}</span>
                              {cred.password !== '[REDACTED]' && (
                                <button onClick={() => copyToClipboard(cred.password, `cred-p-${idx}`)} className="text-muted-foreground hover:text-foreground">
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
                <Server size={16} /> Hosting Server Details
              </h3>
              {(!project.hostingDetails || (!project.hostingDetails.serverName && !project.hostingDetails.ip)) ? (
                <p className="text-xs text-muted-foreground italic">No hosting details recorded.</p>
              ) : (
                <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3 text-sm">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Server/Provider:</span>
                      <p className="font-medium text-xs mt-0.5">{project.hostingDetails.serverName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">IP Address:</span>
                      <div className="flex items-center gap-1 font-mono text-xs mt-0.5">
                        <span>{project.hostingDetails.ip || 'N/A'}</span>
                        {project.hostingDetails.ip && (
                          <button onClick={() => copyToClipboard(project.hostingDetails.ip, 'host-ip')} className="text-muted-foreground hover:text-foreground">
                            {copiedField === 'host-ip' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Username:</span>
                      <p className="font-mono text-xs mt-0.5">{project.hostingDetails.username || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Password:</span>
                      <p className="font-mono text-xs mt-0.5">{project.hostingDetails.password || 'N/A'}</p>
                    </div>
                  </div>
                  {project.hostingDetails.notes && (
                    <div className="pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground">Server Notes:</span>
                      <p className="mt-0.5 whitespace-pre-wrap">{project.hostingDetails.notes}</p>
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

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Paperclip size={16} /> Attachments
                </h3>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors">
                  <Upload size={14} />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                  <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                </label>
              </div>

              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}

              {attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No files attached to this project.</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40 text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip size={14} className="text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{att.original_name || att.name}</span>
                        <span className="text-muted-foreground shrink-0">
                          ({(att.size_bytes / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/attachments/${att.id}`}
                          download
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Download attachment"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete attachment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-between items-center bg-secondary/10 rounded-b-xl">
            <button
              onClick={() => { onClose(); onEdit(project); }}
              className="px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
            >
              Edit Project Details
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-input bg-background hover:bg-secondary text-sm font-medium transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
