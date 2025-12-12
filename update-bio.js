const fs = require('fs');

const filePath = './frontend/src/App.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update management text
content = content.replace(
  '<div className="text-xs text-white font-bold">JARI MONTEZ (Brother/Manager)</div>',
  '<div className="text-xs text-white font-bold">JARI MONTEZ (Brother/Manager)</div>'
);

// Find and replace the bio section
const oldBioEnd = `                   <p className="mt-4 text-[#00ff41] font-bold border-t border-[#333] pt-4">
                      {'>'} SYSTEM NOTE: Artist Profile Last Updated: DEC 04 2004
                   </p>`;

const newBioEnd = `                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-6">Breaking Barriers: Female Dominance in the Game</h3>
                   
                   <p>
                      In an era dominated by male voices, Whip Montez was carving out her own lane in hip-hop with an unapologetic confidence that couldn't be ignored. At a time when female MCs were expected to choose between being "hard" or "commercial," Whip refused to be boxed in. She brought raw lyricism, street credibility, and genuine storytelling to every track—proving that a woman from Red Hook could hold her own on any stage or cipher.
                   </p>

                   <p>
                      Her lyrical prowess wasn't just about matching the men bar for bar—it was about exceeding expectations and rewriting the rules. Whip's verses cut through the noise with precision, tackling everything from relationship dynamics to street politics, always with that signature Red Hook grit. She wasn't asking for a seat at the table; she was building her own and inviting others to join.
                   </p>

                   <p>
                      The early 2000s hip-hop scene was notoriously challenging for female artists, but Whip Montez thrived in that environment. Her performances alongside industry heavyweights like Mobb Deep and Slum Village weren't novelty acts—she earned those spots through undeniable talent and relentless work ethic. Crowds didn't just tolerate a female opening act; they became fans, recognizing that her energy and skill matched anyone in the game.
                   </p>

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-6">The Brother Behind The Vision</h3>
                   
                   <p>
                      Behind every great artist is someone who believed in them first. For Whip Montez, that person was her brother and manager, <strong className="text-white">Jari Montez</strong>. While Whip was perfecting her craft in the booth and on stage, Jari was navigating the complex business of hip-hop—booking shows, negotiating deals, and ensuring his sister's voice would be heard beyond Red Hook.
                   </p>

                   <p>
                      Jari didn't just manage Whip's career; he helped architect her path. He understood that the industry wasn't built for artists like his sister—independent, uncompromising, and fiercely authentic—so he worked tirelessly to create opportunities where none existed. From local showcases to international performances in the Dominican Republic, Jari's strategic vision and unwavering support were instrumental in building the Livewire movement.
                   </p>

                   <p>
                      The brother-sister dynamic brought a unique strength to Whip's operation. There was an inherent trust and loyalty that money couldn't buy. Jari knew Whip's potential before the industry did, and he fought for her with a dedication that only family could provide. He handled the business so Whip could focus on what she did best—making music that mattered. Their partnership was a testament to the power of family, faith, and an unshakeable belief in the dream.
                   </p>

                   <p>
                      Jari's role went beyond typical management—he was a protector, strategist, and believer. In an industry known for exploitation and broken promises, having family in your corner wasn't just an advantage; it was survival. He paved the way, cleared the obstacles, and ensured that every opportunity was maximized. The Livewire legacy wasn't built by one person—it was a family affair, with Jari and Whip moving as one unit toward a shared vision of success.
                   </p>

                   <h3 className="text-white text-base md:text-lg font-black uppercase tracking-wider border-b border-[#00ff41] pb-2 mb-4 mt-8">Memories: The Journey in Pictures</h3>
                   
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 my-6">
                     {[1, 2, 3, 4, 5, 6].map((i) => (
                       <div key={i} className="aspect-square bg-[#1a1a1a] border-2 border-[#333] relative overflow-hidden group hover:border-[#00ff41] transition-all">
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                           <Camera size={32} className="md:w-12 md:h-12 mb-2 opacity-20" />
                           <div className="text-[10px] md:text-xs font-mono">PHOTO {i}</div>
                           <div className="text-[8px] md:text-[10px] font-mono opacity-50">Coming Soon</div>
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                           <div className="text-[#00ff41] text-[9px] md:text-[10px] font-mono">RED HOOK ARCHIVES</div>
                         </div>
                       </div>
                     ))}
                   </div>

                   <p className="text-[10px] md:text-xs text-gray-500 italic text-center border-t border-[#333] pt-4">
                      Photo gallery showcasing studio sessions, live performances, and behind-the-scenes moments from the Livewire era. Check back soon for updates.
                   </p>

                   <p className="mt-8 text-[#00ff41] font-bold border-t border-[#333] pt-4">
                      {'>'} SYSTEM NOTE: Artist Profile Last Updated: DEC 12 2025
                   </p>`;

content = content.replace(oldBioEnd, newBioEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Bio updated successfully!');
