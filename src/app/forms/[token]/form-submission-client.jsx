"use client";

import { useState } from "react";
import { submitProtocolForm } from "./form-actions";
import { cn } from "@/lib/utils";
import { Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function FormSubmissionClient({ instanceId, fields, token }) {
    // ... (state logic remains same just formatted for cleaner UI)
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [responses, setResponses] = useState({});
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage("");

        try {
            const formData = new FormData();
            formData.append("token", token);
            formData.append("data", JSON.stringify(responses));

            const result = await submitProtocolForm(formData);

            if (result.error) {
                setStatus('error');
                setErrorMessage(result.error);
            } else {
                setStatus('success');
            }
        } catch (err) {
            console.error("Submission error:", err);
            setStatus('error');
            setErrorMessage("Failed to submit form. Please try again.");
        }
    };

    // ... recovering original logic ...

    // We will use the original logic but update the JSX return

    const handleInput = (id, value) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    if (status === 'success') {
        return (
            <div className="max-w-3xl mx-auto p-8 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
                <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Form Submitted Successfully!</h2>
                <p className="text-slate-600 font-medium">You can now close this window.</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 md:p-12 border border-slate-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">

            <div className="space-y-8">
                {fields.map((field, index) => {
                    const fieldKey = field.id || `field-${index}`;
                    return (
                        <div key={fieldKey} className="flex flex-col gap-2">
                            <label className="text-base font-semibold text-slate-800">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>

                            {field.description && (
                                <p className="text-sm text-slate-500 leading-relaxed">{field.description}</p>
                            )}

                            {field.type === "textarea" ? (
                                <textarea
                                    required={field.required}
                                    className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 focus:bg-white outline-none transition-all text-slate-800 placeholder:text-slate-400 resize-y text-base"
                                    placeholder="Enter your response..."
                                    value={responses[fieldKey] || ""}
                                    onChange={(e) => handleInput(fieldKey, e.target.value)}
                                />
                            ) : field.type === "select" ? (
                                <div className="relative">
                                    <select
                                        required={field.required}
                                        className="w-full p-3 pl-4 bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 focus:bg-white outline-none transition-all text-slate-800 appearance-none cursor-pointer text-base"
                                        value={responses[fieldKey] || ""}
                                        onChange={(e) => handleInput(fieldKey, e.target.value)}
                                    >
                                        <option value="" disabled className="text-slate-400">Select an option...</option>
                                        {field.options?.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <input
                                    type={field.type || "text"}
                                    required={field.required}
                                    className="w-full p-3 pl-4 bg-slate-50 border border-slate-200 rounded-lg focus:border-slate-400 focus:bg-white outline-none transition-all text-slate-800 placeholder:text-slate-400 text-base"
                                    placeholder="Your answer"
                                    value={responses[fieldKey] || ""}
                                    onChange={(e) => handleInput(fieldKey, e.target.value)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {errorMessage && (
                <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle size={16} /> {errorMessage}
                </div>
            )}

            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="px-8 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {status === 'submitting' ? 'Submitting...' : 'Submit Form'}
                </button>

                <button
                    type="button"
                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
                    onClick={() => setResponses({})}
                >
                    Clear
                </button>
            </div>
        </form>
    );
}
