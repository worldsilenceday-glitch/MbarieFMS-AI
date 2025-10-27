import React, { useState } from 'react';
import { EmailDraft } from '../hooks/useChatAgent';

interface DraftModalProps {
  draft: EmailDraft;
  isOpen: boolean;
  onClose: () => void;
  onSend: (draft: EmailDraft, overrideRecipients?: string[], finalBody?: string) => void;
  // onEdit: (draft: EmailDraft) => void;
}

const DraftModal: React.FC<DraftModalProps> = ({
  draft,
  isOpen,
  onClose,
  onSend
}) => {
  const [recipients, setRecipients] = useState<string[]>(draft.suggestedRecipients);
  const [customRecipient, setCustomRecipient] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(draft.body);
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleAddRecipient = () => {
    if (customRecipient.trim() && !recipients.includes(customRecipient.trim())) {
      setRecipients(prev => [...prev, customRecipient.trim()]);
      setCustomRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  };

  const handleSend = () => {
    if (!isConfirmed) {
      alert('Please confirm that the email is ready to send');
      return;
    }

    const finalBody = isEditing ? editedBody : draft.body;
    onSend(draft, recipients, finalBody);
    handleClose();
  };

  const handleEdit = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedBody(draft.body);
    setRecipients(draft.suggestedRecipients);
    setIsConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Email Draft Preview</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and send the generated email draft
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <div className="p-3 bg-gray-50 rounded border border-gray-300">
              {draft.subject}
            </div>
          </div>

          {/* Recipients */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {recipients.map((email, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customRecipient}
                  onChange={(e) => setCustomRecipient(e.target.value)}
                  placeholder="Add recipient email"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                />
                <button
                  type="button"
                  onClick={handleAddRecipient}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Body
              </label>
              <button
                type="button"
                onClick={handleEdit}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {isEditing ? 'Preview' : 'Edit'}
              </button>
            </div>
            
            {isEditing ? (
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email body..."
              />
            ) : (
              <div className="p-4 bg-gray-50 rounded border border-gray-300 whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
                {draft.body}
              </div>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                I confirm this email is ready to send and contains appropriate content
              </span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!isConfirmed || recipients.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftModal;
