// Não usado
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { runConnectionDiagnostics, clearSession, getDiagnosticInfo } from '../services/supabase';
import { Icons } from '../components/Icons';

export const Diagnostic: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
    const [results, setResults] = useState<any>(null);
    const [config, setConfig] = useState(getDiagnosticInfo());

    useEffect(() => {
        startDiagnostics();
    }, []);

    const startDiagnostics = async () => {
        setStatus('running');
        setResults(null);
        await new Promise(r => setTimeout(r, 500));
        const res = await runConnectionDiagnostics();
        setResults(res);
        setStatus('finished');
    };

    const StatusIcon = ({ success }: { success: boolean }) => (
        success 
        ? <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><Icons.BadgeCheck className="w-4 h-4" /></div>
        : <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><Icons.X className="w-4 h-4" /></div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Icons.Activity className="w-5 h-5 text-[#7900c5]" />
                        Status do Sistema (Local)
                    </h1>
                    <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        Voltar ao Login
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-gray-100 dark:bg-gray-900 p-4 rounded-xl">
                        <div>
                            <span className="text-gray-500 block">SUPABASE URL</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">{config.localUrl}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">ANON KEY</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">{config.localKeySnippet}</span>
                        </div>
                    </div>

                    {/* Testes */}
                    {status === 'running' && (
                        <div className="py-12 text-center">
                            <div className="w-12 h-12 border-4 border-[#7900c5] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500 font-medium">Verificando conexão com Supabase Local...</p>
                        </div>
                    )}

                    {status === 'finished' && results && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Conexão com Banco de Dados</span>
                                <StatusIcon success={results.serverReachable} />
                            </div>

                            <div className="mt-6">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Logs</p>
                                <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-xs h-40 overflow-y-auto">
                                    {results.details.map((line: string, i: number) => (
                                        <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">{line}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <button 
                                    onClick={startDiagnostics}
                                    className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Testar Novamente
                                </button>
                                <button 
                                    onClick={clearSession}
                                    className="bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Resetar Cache do App
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};