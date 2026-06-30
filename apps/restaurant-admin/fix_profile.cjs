const fs = require('fs');
const filePath = 'e:/dev/growtez/tablekard/apps/restaurant-admin/src/pages/profile/profile.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// The block to move starts with:
//         <div
//           style={{
//             display: activeTab === "payments" ? "block" : "none",
//           }}
//         >
// and ends with its matching </div>.
// According to our line numbers, the block is lines 2091 to 2237 (inclusive, 0-indexed it would be 2090 to 2236).

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('display: activeTab === "payments" ? "block" : "none"')) {
        // The div starts 2 lines before this
        startIndex = i - 2;
        break;
    }
}

if (startIndex !== -1) {
    // Find the end index of the block by counting braces/divs or simply finding the end of the payments rendering logic.
    // The payments rendering logic ends with:
    //                 </div>
    //               </div>
    //             )}
    //           </div>
    //         </div>
    
    // We know from the view_file that the block ends right before:
    //       </div>
    //     );
    //   }
    //   function renderAdminReadOnly(): React.ReactNode {
    
    // Let's just find the exact lines 2091-2237 (1-indexed). But lines can shift.
    // Let's find the exact text.
    
    let endSearchStr = `              </div>
            )}
          </div>
        </div>`;
        
    for (let i = startIndex; i < lines.length; i++) {
        if (lines[i].includes('</div>') && lines[i-1].includes(')}') && lines[i-2].includes('</div>')) {
            // this is fuzzy, let's just find the end manually by counting divs
            let divCount = 0;
            let started = false;
            for (let j = startIndex; j < lines.length; j++) {
                if (lines[j].includes('<div')) {
                    divCount += (lines[j].match(/<div/g) || []).length;
                    started = true;
                }
                if (lines[j].includes('</div')) {
                    divCount -= (lines[j].match(/<\/div/g) || []).length;
                }
                
                if (started && divCount === 0) {
                    endIndex = j;
                    break;
                }
            }
            break;
        }
    }
}

if (startIndex !== -1 && endIndex !== -1) {
    const blockToMove = lines.slice(startIndex, endIndex + 1).join('\n');
    
    // Remove the block from its current position
    lines.splice(startIndex, endIndex - startIndex + 1);
    
    // Find where to insert it: right before the end of renderRestaurantProfileContent
    // renderRestaurantProfileContent ends around line 1947:
    //         </div>
    //       </div>
    //     );
    //   }
    //   function renderAdminEditor(): React.ReactNode {
    
    let insertIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('function renderAdminEditor()')) {
            // Found the start of renderAdminEditor. 
            // The function renderRestaurantProfileContent ends a few lines above this.
            // Let's insert the block right before the return statement's closing `</div>`
            // Specifically, before `      </div>\n    );\n  }`
            insertIndex = i - 3;
            break;
        }
    }
    
    if (insertIndex !== -1) {
        lines.splice(insertIndex, 0, blockToMove);
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log("Successfully moved the payments block.");
    } else {
        console.log("Could not find insert index.");
    }
} else {
    console.log("Could not find the payments block.");
}
