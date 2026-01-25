import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Subject, Category, FileData, TabItem, FlashcardDeck } from '../types';
import { Icons } from '../components/Icons';
import { Service } from '../services/supabase';
import { FileCard } from '../components/shared/FileCard';
import { PostSkeleton } from '../components/shared/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardGame } from '../components/flashcards/FlashcardGame';
import { useToast } from '../contexts/ToastContext';

const TABS: TabItem[] = [
  { id: 'summary', label: 'Resumos' },
  { id: 'activity', label: 'Atividades' },
  { id: 'assessment', label: 'Avaliações' },
  { id: 'flashcards', label: 'Flashcards' },
];

type SourceFilter = 'all' | 'official' | 'community';

export const SubjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  
  const [subject, setSubject] = useState<Subject | null>(location.state?.subject || null);
  const [activeTab, setActiveTab] = useState<Category | 'flashcards'>('summary');
  const [files, setFiles] = useState<FileData[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [playingDeckId, setPlayingDeckId] = useState<string | null>(null);
  const [playingCards, setPlayingCards] = useState<any[]>([]);
  
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [deckModalMode, setDeckModalMode] = useState<'create' | 'edit'>('create');
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState('');
  const [cardsInput, setCardsInput] = useState([{ front: '', back: '' }]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  useEffect(() => {
    if (!subject && id) {
        const fetchSub = async () => {
             const subs = await Service.getAllSubjects();
             const found = subs.find(s => s.id === id);
             if (found) setSubject(found);
        };
        fetchSub();
    }
  }, [id, subject]);

  useEffect(() => {
    fetchData();
  }, [id, activeTab, sourceFilter, user]);

  const fetchData = async () => {
      setLoading(true);
      if (!id || !user) return;

      if (activeTab === 'flashcards') {
          // @ts-ignore
          const d = await Service.getFlashcardDecks(id);
          setDecks(d);
      } else {
          const data = await Service.getFiles(id, activeTab as Category, sourceFilter, null, user.id);
          setFiles(data);
      }
      setLoading(false);
  };

  const handlePlayDeck = async (deckId: string) => {
      // @ts-ignore
      const cards = await Service.getDeckCards(deckId);
      setPlayingCards(cards);
      setPlayingDeckId(deckId);
  };

  const openCreateDeck = () => {
      setDeckModalMode('create');
      setDeckTitle('');
      setCardsInput([{ front: '', back: '' }]);
      setShowDeckModal(true);
  };

  const openEditDeck = async (e: React.MouseEvent, deck: FlashcardDeck) => {
      e.stopPropagation();
      setDeckModalMode('edit');
      setEditingDeckId(deck.id);
      setDeckTitle(deck.title);
      
      // @ts-ignore
      const cards = await Service.getDeckCards(deck.id);
      setCardsInput(cards.map((c: any) => ({ id: c.id, front: c.front, back: c.back })));
      setShowDeckModal(true);
  };

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
      e.stopPropagation();
      if (!window.confirm("Tem certeza? Isso apagará todas as cartas deste baralho.")) return;
      
      // @ts-ignore
      await Service.deleteFlashcardDeck(deckId);
      addToast("Baralho excluído.", "info");
      fetchData();
  };

  const handleSaveDeck = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!subject || !user) return;
      if (!deckTitle.trim()) return addToast("Defina um título para o baralho.", "error");
      
      const validCards = cardsInput.filter(c => c.front.trim() && c.back.trim());
      if (validCards.length === 0) return addToast("Adicione pelo menos 1 carta.", "error");

      if (deckModalMode === 'create') {
          // @ts-ignore
          await Service.createFlashcardDeck(subject.id, deckTitle, user.id, validCards);
          addToast("Baralho criado com sucesso!");
      } else if (deckModalMode === 'edit' && editingDeckId) {
          // @ts-ignore
          await Service.updateFlashcardDeck(editingDeckId, deckTitle, validCards);
          addToast("Baralho atualizado!");
      }

      setShowDeckModal(false);
      fetchData(); 
  };

  const addCardInput = () => setCardsInput([...cardsInput, { front: '', back: '' }]);
  
  const removeCardInput = (index: number) => {
      if (cardsInput.length > 1) {
          setCardsInput(cardsInput.filter((_, i) => i !== index));
      }
  };

  const handleCardChange = (index: number, field: 'front' | 'back', value: string) => {
      const copy = [...cardsInput];
      // @ts-ignore
      copy[index][field] = value;
      setCardsInput(copy);
  };


  const handleDeleteFile = (id: string) => {
      setFiles(prev => prev.filter(f => f.id !== id));
  };

  const filteredFiles = useMemo(() => {
      if (!searchTerm) return files;
      const lowerSearch = searchTerm.toLowerCase();
      return files.filter(file => 
          file.title.toLowerCase().includes(lowerSearch) ||
          file.description?.toLowerCase().includes(lowerSearch)
      );
  }, [files, searchTerm]);

  if (!subject) return <div className="p-6 text-center text-gray-500">Carregando informações da matéria...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      
      <div className="bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-gray-800 pt-4 pb-3 sticky top-0 z-30 transition-colors shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
              
              <div className="flex items-center gap-3 mb-3">
                   <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                      <Icons.ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {subject.name}
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject.color_hex }}></div>
                      </h1>
                  </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  
                  {activeTab !== 'flashcards' && (
                      <div className="relative w-full md:w-64 md:flex-shrink-0">
                          <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <input 
                              type="text" 
                              placeholder="Filtrar..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-gray-400"
                          />
                      </div>
                  )}

                  <div className="flex-1 flex flex-col md:flex-row gap-2 md:items-center md:justify-between min-w-0">
                      
                      <div className="overflow-x-auto no-scrollbar w-full md:w-auto">
                          <div className="flex bg-gray-100 dark:bg-gray-900 p-0.5 rounded-xl w-max md:w-auto">
                              {TABS.map((tab) => (
                                  <button
                                      key={tab.id}
                                      onClick={() => setActiveTab(tab.id as Category | 'flashcards')}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                                          activeTab === tab.id
                                              ? 'bg-white dark:bg-[#121212] text-primary shadow-sm'
                                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                      }`}
                                  >
                                      {tab.label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {activeTab !== 'flashcards' && (
                          <div className="overflow-x-auto no-scrollbar w-full md:w-auto md:ml-auto">
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-0.5 rounded-xl w-max md:w-auto">
                                    <button onClick={() => setSourceFilter('all')} className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${sourceFilter === 'all' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <Icons.Filter className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold">Todos</span>
                                    </button>
                                    <button onClick={() => setSourceFilter('official')} className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${sourceFilter === 'official' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <Icons.BadgeCheck className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold">Oficial</span>
                                    </button>
                                    <button onClick={() => setSourceFilter('community')} className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${sourceFilter === 'community' ? 'bg-primary shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <Icons.Users className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold">Social</span>
                                    </button>
                                </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {activeTab === 'flashcards' ? (
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Seus Baralhos</h3>
                        <p className="text-xs text-gray-500">Estude com repetição espaçada.</p>
                    </div>
                    <button onClick={openCreateDeck} className="bg-[#7900c5] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-[#60009e] transition-colors flex items-center gap-2">
                        <Icons.Plus className="w-4 h-4" /> <span>Criar Baralho</span>
                    </button>
                </div>

                {decks.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-[#121212] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                        <Icons.Zap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Nenhum baralho criado ainda.</p>
                        <button onClick={openCreateDeck} className="text-[#7900c5] text-xs font-bold mt-2 hover:underline">Começar agora</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {decks.map(deck => {
                            const canEdit = user && (deck.creator_id === user.id || profile?.role === 'admin');
                            
                            return (
                            <div 
                                key={deck.id} 
                                onClick={() => handlePlayDeck(deck.id)}
                                className="group relative aspect-[1.6/1] bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-50 transition-opacity">
                                    <Icons.Layers className="w-16 h-16 text-white rotate-12" />
                                </div>
                                
                                {canEdit && (
                                    <div className="absolute top-3 right-3 flex gap-1 z-20">
                                        <button 
                                            onClick={(e) => openEditDeck(e, deck)}
                                            className="p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm transition-colors"
                                        >
                                            <Icons.Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteDeck(e, deck.id)}
                                            className="p-1.5 bg-black/20 hover:bg-red-500/80 rounded-full text-white backdrop-blur-sm transition-colors"
                                        >
                                            <Icons.Trash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                                    <div>
                                        <h4 className="font-bold text-lg leading-tight mb-1 line-clamp-2">{deck.title}</h4>
                                        <p className="text-xs font-medium opacity-90">por {deck.creator_name || 'Alguém'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-xs font-bold">
                                            {deck.cards_count} Cartas
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PostSkeleton />
                        <PostSkeleton />
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-600">
                            <Icons.Dynamic name={subject.icon_name} className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-bold mb-1">Nada nesta seção.</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {searchTerm ? 'Tente buscar com outro termo.' : 'Seja o primeiro a compartilhar algo aqui!'}
                        </p>
                        {!searchTerm && (
                             <button onClick={() => navigate('/upload')} className="mt-6 text-sm font-bold text-primary hover:underline">
                                 Criar novo material
                             </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredFiles.map(file => (
                            <FileCard 
                                key={file.id} 
                                file={file} 
                                colorHex={subject.color_hex} 
                                highlightTerm={searchTerm}
                                onDelete={handleDeleteFile}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      {showDeckModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#121212] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {deckModalMode === 'create' ? 'Novo Baralho' : 'Editar Baralho'}
                      </h3>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título do Baralho</label>
                          <input 
                            value={deckTitle} 
                            onChange={e => setDeckTitle(e.target.value)} 
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#7900c5]" 
                            placeholder="Ex: Fórmulas de Cinemática"
                          />
                      </div>
                      
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <label className="block text-xs font-bold text-gray-500 uppercase">Cartas ({cardsInput.length})</label>
                          </div>
                          
                          {cardsInput.map((card, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 relative group transition-all hover:border-[#7900c5]/30">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-[10px] font-bold text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
                                          #{idx + 1}
                                      </span>
                                      {cardsInput.length > 1 && (
                                          <button 
                                            onClick={() => removeCardInput(idx)}
                                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                                            title="Remover Carta"
                                          >
                                              <Icons.X className="w-4 h-4" />
                                          </button>
                                      )}
                                  </div>
                                  
                                  <input 
                                    placeholder="Frente (Pergunta)" 
                                    value={card.front} 
                                    onChange={e => handleCardChange(idx, 'front', e.target.value)}
                                    className="w-full p-2 mb-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm outline-none focus:border-[#7900c5] focus:ring-1 focus:ring-[#7900c5]" 
                                  />
                                  <textarea 
                                    placeholder="Verso (Resposta)" 
                                    value={card.back} 
                                    onChange={e => handleCardChange(idx, 'back', e.target.value)}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm resize-none h-16 outline-none focus:border-[#7900c5] focus:ring-1 focus:ring-[#7900c5]" 
                                  />
                              </div>
                          ))}
                          
                          <button onClick={addCardInput} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 font-bold text-sm hover:border-[#7900c5] hover:text-[#7900c5] hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all flex items-center justify-center gap-2">
                              <Icons.Plus className="w-4 h-4" /> Adicionar Carta
                          </button>
                      </div>
                  </div>
                  
                  <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                      <button onClick={() => setShowDeckModal(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Cancelar</button>
                      <button onClick={handleSaveDeck} className="px-6 py-2 bg-[#7900c5] text-white rounded-lg text-sm font-bold shadow-lg hover:bg-[#60009e] transition-all transform active:scale-95">Salvar</button>
                  </div>
              </div>
          </div>
      )}

      {playingDeckId && (
          <FlashcardGame cards={playingCards} onClose={() => { setPlayingDeckId(null); setPlayingCards([]); }} />
      )}

    </div>
  );
};