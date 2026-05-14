// social.jsx — Leaderboard (school/friends), Friends + Chat, Profile
// Exposes: SocialScreen, ProfileScreen

function SocialScreen({ T, onNav, openChat, setOpenChat }) {
  const [tab, setTab] = React.useState('school');
  const [friendTab, setFriendTab] = React.useState('rank'); // rank | group | requests
  const [showAddFriend, setShowAddFriend] = React.useState(false);
  const [requests, setRequests] = React.useState(window.FRIEND_REQUESTS);
  const [friends, setFriends] = React.useState(window.SAMPLE_FRIENDS);
  const [outgoing, setOutgoing] = React.useState([]); // ids we've sent to

  const acceptReq = (id) => {
    const r = requests.find(x => x.id === id);
    if (!r) return;
    setRequests(reqs => reqs.filter(x => x.id !== id));
    setFriends(fs => [...fs, {
      id: r.id, name: r.name, school: r.school,
      pts: 800 + Math.floor(Math.random() * 1200),
      streak: Math.floor(Math.random() * 14),
      avatar: r.avatar, color: r.color,
    }]);
  };
  const declineReq = (id) => setRequests(reqs => reqs.filter(x => x.id !== id));
  const sendInvite = (id) => setOutgoing(o => o.includes(id) ? o : [...o, id]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        <div style={{ padding: '54px 20px 8px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <MicroLabel T={T}>Squad</MicroLabel>
            <SerifTitle T={T} size={42} style={{ marginTop: 2 }}>Friends & ranks</SerifTitle>
          </div>
          <CircleBtn T={T} size={36} tone="magenta" onClick={() => setShowAddFriend(true)} label="Add friend">
            +
          </CircleBtn>
        </div>

        {/* Top tabs */}
        <div style={{ padding: '6px 20px 16px' }}>
          <div style={{
            display: 'flex', padding: 3, borderRadius: 12, gap: 2,
            background: T.surface, border: `1px solid ${T.surfaceEdge}`,
          }}>
            {[
              { id: 'school',  label: 'School' },
              { id: 'friends', label: 'Friends' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: tab === t.id ? T.accentGrad : 'transparent',
                color: tab === t.id ? '#fff' : T.sub,
                fontFamily: T.fBody, fontSize: 14, fontWeight: 600,
                boxShadow: tab === t.id && T.isTwilight ? `0 0 12px ${T.magenta}55` : 'none',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {tab === 'school' && <SchoolBoard T={T} />}
        {tab === 'friends' && (
          <FriendsTab T={T} friendTab={friendTab} setFriendTab={setFriendTab}
                      openChat={openChat} setOpenChat={setOpenChat}
                      friends={friends}
                      requests={requests} onAccept={acceptReq} onDecline={declineReq}
                      onAddFriend={() => setShowAddFriend(true)} />
        )}
      </div>
      <BottomNav T={T} onNav={onNav} active="friends" />
      {showAddFriend && (
        <AddFriendSheet T={T} onClose={() => setShowAddFriend(false)}
                        outgoing={outgoing} onInvite={sendInvite} />
      )}
    </div>
  );
}

function SchoolBoard({ T }) {
  const board = window.SAMPLE_SCHOOL_BOARD;
  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{
        margin: '0 0 16px', padding: 16, borderRadius: 18,
        background: T.dark ? 'rgba(216,160,74,0.10)' : 'rgba(217,119,6,0.08)',
        border: `0.5px solid ${T.accent}55`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.fDisplay, fontSize: 22, color: '#fff', fontWeight: 600,
        }}>8</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.sub, letterSpacing: 0.2 }}>
            You're 8th at Eric Hamber
          </div>
          <div style={{ fontFamily: T.fDisplay, fontSize: 22, color: T.ink, marginTop: 2, lineHeight: 1 }}>
            215 pts from #5
          </div>
        </div>
      </div>
      <div style={{
        borderRadius: 18, overflow: 'hidden',
        background: T.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
        border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
      }}>
        {board.map((row, i) => (
          <div key={row.rank} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: row.isMe
              ? (T.dark ? 'rgba(216,160,74,0.10)' : 'rgba(217,119,6,0.08)')
              : 'transparent',
            borderTop: i === 0 ? 'none'
              : `0.5px solid ${T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.05)'}`,
          }}>
            <div style={{
              width: 24, textAlign: 'right',
              fontFamily: T.fMono, fontSize: 13, color: row.rank <= 3 ? T.accent : T.sub,
              fontWeight: row.rank <= 3 ? 700 : 500,
            }}>{row.rank}</div>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: row.isMe ? T.accent : (T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.06)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.fBody, fontSize: 14, fontWeight: 600,
              color: row.isMe ? '#fff' : T.ink,
            }}>{row.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: T.fBody, fontSize: 15, color: T.ink, fontWeight: row.isMe ? 600 : 500,
                letterSpacing: -0.1,
              }}>{row.name}</div>
              {row.friend && (
                <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.accent, marginTop: 1 }}>
                  ✦ friend
                </div>
              )}
            </div>
            <div style={{
              fontFamily: T.fMono, fontSize: 13, color: T.ink, fontWeight: 600, letterSpacing: 0.2,
            }}>{row.pts.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FriendsTab({ T, friendTab, setFriendTab, openChat, setOpenChat,
                     friends, requests, onAccept, onDecline, onAddFriend }) {
  if (openChat) {
    return <GroupChat T={T} onBack={() => setOpenChat(false)} />;
  }
  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <SubTab T={T} active={friendTab === 'rank'} onClick={() => setFriendTab('rank')}>Rank</SubTab>
        <SubTab T={T} active={friendTab === 'group'} onClick={() => setFriendTab('group')}>Groups</SubTab>
        <SubTab T={T} active={friendTab === 'requests'} onClick={() => setFriendTab('requests')} badge={requests.length}>
          Requests
        </SubTab>
      </div>
      {friendTab === 'rank' && <FriendBoard T={T} friends={friends} />}
      {friendTab === 'group' && <GroupList T={T} onOpen={() => setOpenChat(true)} />}
      {friendTab === 'requests' && (
        <RequestsList T={T} requests={requests} onAccept={onAccept} onDecline={onDecline}
                      onAddFriend={onAddFriend} />
      )}
    </div>
  );
}

function RequestsList({ T, requests, onAccept, onDecline, onAddFriend }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {requests.length === 0 ? (
        <div style={{
          padding: '32px 18px', textAlign: 'center', borderRadius: 16,
          border: `1px dashed ${T.surfaceEdge}`, background: T.surface,
        }}>
          <div style={{ fontFamily: T.fHand, fontSize: 22, color: T.soft, marginBottom: 8 }}>
            no pending requests —
          </div>
          <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
            When friends invite you, they'll show up here.
          </div>
        </div>
      ) : (
        <>
          <div style={{
            fontFamily: T.fMono, fontSize: 10.5, letterSpacing: 1.6, textTransform: 'uppercase',
            color: T.sub, padding: '0 4px',
          }}>
            {requests.length} {requests.length === 1 ? 'invite' : 'invites'} waiting
          </div>
          {requests.map(r => (
            <div key={r.id} style={{
              padding: '14px', borderRadius: 16,
              background: T.isTwilight
                ? `linear-gradient(135deg, ${r.color}15, transparent)`
                : T.surface,
              border: `1px solid ${r.color}66`,
              boxShadow: T.isTwilight ? `0 0 18px ${r.color}22` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `linear-gradient(135deg, ${r.color}, ${r.color}aa)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.fBody, fontSize: 17, fontWeight: 600, color: '#fff',
                boxShadow: `0 4px 14px ${r.color}55`,
              }}>{r.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.fBody, fontSize: 15, fontWeight: 600, color: T.ink }}>
                  {r.name}
                </div>
                <div style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub, marginTop: 2 }}>
                  {r.school} · {r.mutual} mutual · {r.when}
                </div>
              </div>
              <button onClick={() => onDecline(r.id)} aria-label="Decline" style={{
                width: 34, height: 34, borderRadius: '50%',
                background: T.surface, border: `1px solid ${T.surfaceEdge}`,
                color: T.sub, fontSize: 14, cursor: 'pointer',
              }}>✕</button>
              <button onClick={() => onAccept(r.id)} style={{
                padding: '8px 14px', borderRadius: 999, border: 'none',
                background: T.accentGrad, color: '#fff',
                fontFamily: T.fBody, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: T.isTwilight ? `0 0 14px ${T.magenta}66` : 'none',
              }}>Accept</button>
            </div>
          ))}
        </>
      )}
      <button onClick={onAddFriend} style={{
        marginTop: 6, padding: '12px', borderRadius: 12, cursor: 'pointer',
        background: 'transparent', border: `1px dashed ${T.surfaceEdge}`,
        fontFamily: T.fBody, fontSize: 13, color: T.sub,
      }}>+ Find friends to add</button>
    </div>
  );
}

function AddFriendSheet({ T, onClose, outgoing, onInvite }) {
  const [q, setQ] = React.useState('');
  const [codeMode, setCodeMode] = React.useState(false);
  const suggestions = window.FRIEND_SUGGESTIONS.filter(s =>
    !q || s.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <Sheet T={T} onClose={onClose} title="Add friends">
      <div style={{ padding: '4px 20px 14px' }}>
        <div style={{
          padding: '12px 14px', borderRadius: 14,
          background: T.surface, border: `1px solid ${T.surfaceEdge}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 14, color: T.sub }}>⌕</span>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search by name or @username"
            autoFocus
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: T.fBody, fontSize: 15, color: T.ink,
            }}
          />
        </div>
      </div>

      <div style={{ padding: '0 20px 18px' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <Pill T={T} icon="🔗" tone="cyan" active={codeMode}
                onClick={() => setCodeMode(c => !c)}>Add by code</Pill>
          <Pill T={T} icon="📲" tone="purple" onClick={() => {}}>Contacts</Pill>
          <Pill T={T} icon="🔗" tone="magenta" onClick={() => {}}>Share link</Pill>
        </div>
      </div>

      {codeMode && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            padding: '16px 14px', borderRadius: 16,
            background: T.isTwilight ? 'rgba(6,214,224,0.06)' : T.surface,
            border: `1px solid ${T.cyan}55`,
            boxShadow: T.isTwilight ? `0 0 0 3px ${T.cyan}22, 0 0 18px ${T.cyan}44` : 'none',
          }}>
            <MicroLabel T={T} color={T.cyan}>Enter their code</MicroLabel>
            <input
              placeholder="e.g. 9P3Q2A"
              style={{
                width: '100%', marginTop: 10, padding: '10px 12px',
                fontFamily: T.fMono, fontSize: 22, letterSpacing: 3, textAlign: 'center',
                background: T.surface, color: T.ink,
                border: `1px solid ${T.surfaceEdge}`, borderRadius: 12, outline: 'none',
              }}
            />
            <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.sub, marginTop: 10, textAlign: 'center' }}>
              They'll see your name and have to accept.
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 24px 8px' }}>
        <MicroLabel T={T}>From your school</MicroLabel>
      </div>
      <div style={{ padding: '0 16px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suggestions.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', fontFamily: T.fBody, fontSize: 13, color: T.sub }}>
            No one matches “{q}”.
          </div>
        )}
        {suggestions.map(s => {
          const invited = outgoing.includes(s.id);
          return (
            <div key={s.id} style={{
              padding: '12px', borderRadius: 14,
              background: T.surface, border: `1px solid ${T.surfaceEdge}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${s.color}, ${s.color}aa)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.fBody, fontSize: 15, fontWeight: 600, color: '#fff',
              }}>{s.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.fBody, fontSize: 14.5, fontWeight: 500, color: T.ink }}>
                  {s.name}
                </div>
                <div style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub, marginTop: 2 }}>
                  {s.mutual} mutual friends
                </div>
              </div>
              <button onClick={() => !invited && onInvite(s.id)} disabled={invited} style={{
                padding: '7px 14px', borderRadius: 999, border: 'none',
                background: invited
                  ? T.surface
                  : T.accentGrad,
                border: invited ? `1px solid ${T.surfaceEdge}` : 'none',
                color: invited ? T.sub : '#fff',
                fontFamily: T.fBody, fontSize: 12.5, fontWeight: 600,
                cursor: invited ? 'default' : 'pointer',
                boxShadow: !invited && T.isTwilight ? `0 0 12px ${T.magenta}44` : 'none',
              }}>{invited ? 'Sent ✓' : 'Add'}</button>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

function SubTab({ T, active, onClick, children, badge }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
      background: active ? T.ink : 'transparent',
      color: active ? T.bg : T.sub,
      fontFamily: T.fBody, fontSize: 13, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      position: 'relative',
    }}>
      {children}
      {badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
          background: T.magenta, color: '#fff',
          fontFamily: T.fMono, fontSize: 10, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: T.isTwilight ? `0 0 10px ${T.magenta}99` : 'none',
        }}>{badge}</span>
      )}
    </button>
  );
}

function FriendBoard({ T, friends }) {
  const list = [...(friends || window.SAMPLE_FRIENDS)].sort((a, b) => b.pts - a.pts);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {list.map((f, i) => (
        <div key={f.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 14,
          background: f.id === 'u1'
            ? (T.dark ? 'rgba(216,160,74,0.10)' : 'rgba(217,119,6,0.08)')
            : (T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)'),
          border: `0.5px solid ${f.id === 'u1' ? T.accent + '55' : (T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)')}`,
        }}>
          <div style={{
            width: 28, textAlign: 'center',
            fontFamily: T.fDisplay, fontSize: 22, color: i < 3 ? T.accent : T.sub,
            lineHeight: 1,
          }}>{i + 1}</div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: f.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fBody, fontSize: 15, fontWeight: 600, color: '#fff',
          }}>{f.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: T.fBody, fontSize: 15, color: T.ink, fontWeight: 600, letterSpacing: -0.1,
            }}>{f.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <span style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.accent, fontWeight: 600 }}>
                🔥 {f.streak}d
              </span>
              <span style={{ fontFamily: T.fBody, fontSize: 11.5, color: T.sub }}>
                {f.school}
              </span>
            </div>
          </div>
          <div style={{
            fontFamily: T.fMono, fontSize: 14, color: T.ink, fontWeight: 600,
          }}>{f.pts.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function GroupList({ T, onOpen }) {
  const groups = [
    { name: 'Chem Buddies', members: 4, lastMsg: 'study sesh at the library after school?', who: 'Maya R.', unread: 2, when: '3:46p' },
    { name: 'Volleyball', members: 7, lastMsg: 'bus leaves at 2:45 sharp', who: 'Coach', unread: 0, when: '12:10p' },
    { name: 'Eng 11 grind', members: 3, lastMsg: 'is the essay 800 or 1000 words', who: 'Jordan K.', unread: 0, when: 'Tue' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map((g, i) => (
          <button key={i} onClick={() => i === 0 && onOpen()} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px', borderRadius: 14, border: 'none', textAlign: 'left',
            background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer', width: '100%',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(28,25,23,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.fDisplay, fontSize: 18, color: T.ink,
            }}>{g.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              }}>
                <div style={{
                  fontFamily: T.fBody, fontSize: 15, fontWeight: 600, color: T.ink, letterSpacing: -0.1,
                }}>{g.name}</div>
                <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.soft }}>{g.when}</div>
              </div>
              <div style={{
                fontFamily: T.fBody, fontSize: 13, color: T.sub, marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{g.who}: {g.lastMsg}</div>
            </div>
            {g.unread > 0 && (
              <div style={{
                minWidth: 20, height: 20, borderRadius: 10, padding: '0 6px',
                background: T.accent, color: '#fff',
                fontFamily: T.fBody, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{g.unread}</div>
            )}
          </button>
        ))}
        <button style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'transparent',
          border: `1px dashed ${T.dark ? 'rgba(255,255,255,0.18)' : 'rgba(28,25,23,0.22)'}`,
          color: T.sub, fontFamily: T.fBody, fontSize: 14, cursor: 'pointer',
        }}>+ New group</button>
      </div>
    </div>
  );
}

function GroupChat({ T, onBack }) {
  const [draft, setDraft] = React.useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px 12px',
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: T.accent,
          fontFamily: T.fBody, fontSize: 15, cursor: 'pointer', padding: 0,
        }}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: T.fBody, fontSize: 15, fontWeight: 600, color: T.ink }}>Chem Buddies</div>
          <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.sub }}>4 members · all 11th</div>
        </div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {window.SAMPLE_CHAT.map(m => (
          <div key={m.id} style={{
            display: 'flex', flexDirection: m.mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end',
          }}>
            {!m.mine && (
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: m.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.fBody, fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
              }}>{m.who[0]}</div>
            )}
            <div style={{ maxWidth: '78%' }}>
              {!m.mine && (
                <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.sub, marginBottom: 2, paddingLeft: 4 }}>
                  {m.who}
                </div>
              )}
              <div style={{
                padding: '9px 13px', borderRadius: 16,
                background: m.mine ? T.accent : (T.dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)'),
                color: m.mine ? '#fff' : T.ink,
                fontFamily: T.fBody, fontSize: 14.5, lineHeight: 1.3, letterSpacing: -0.1,
                borderBottomRightRadius: m.mine ? 4 : 16,
                borderBottomLeftRadius: !m.mine ? 4 : 16,
              }}>{m.text}</div>
              <div style={{
                fontFamily: T.fBody, fontSize: 10, color: T.soft, marginTop: 2,
                textAlign: m.mine ? 'right' : 'left', paddingLeft: m.mine ? 0 : 4, paddingRight: m.mine ? 4 : 0,
              }}>{m.ts}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        margin: '8px 16px 0', display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 6px 6px 14px', borderRadius: 22,
        background: T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
        border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.1)' : 'rgba(28,25,23,0.1)'}`,
      }}>
        <input
          value={draft} onChange={e => setDraft(e.target.value)}
          placeholder="Message Chem Buddies"
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontFamily: T.fBody, fontSize: 14.5, color: T.ink, padding: '4px 0',
          }}
        />
        <button style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          background: draft.trim() ? T.accent : (T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'),
          color: draft.trim() ? '#fff' : T.soft, cursor: 'pointer',
          fontSize: 14,
        }}>↑</button>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────
function ProfileScreen({ T, school, code, points, streak, onNav, onSignOut, parentPaired,
                        tweaks, setTweak }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        <div style={{ padding: '54px 20px 16px' }}>
          <MicroLabel T={T}>Profile</MicroLabel>
          <SerifTitle T={T} size={36} style={{ marginTop: 2 }}>Alex Chen</SerifTitle>
          <div style={{ fontFamily: T.fBody, fontSize: 14, color: T.sub, marginTop: 4 }}>
            {school?.name || 'Eric Hamber Secondary'} · Grade 11
          </div>
        </div>

        {/* Stats row */}
        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10 }}>
          <Stat T={T} label="Points" value={points.toLocaleString()} accent />
          <Stat T={T} label="Streak" value={`${streak}d`} />
          <Stat T={T} label="Done" value="47" />
        </div>

        {/* Theme picker */}
        <Section T={T} title="Theme">
          <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
            <ThemeCard T={T} name="Twilight" id="twilight" active={tweaks?.vibe === 'twilight'}
              setTweak={setTweak}
              colors={['#ec4899', '#a78bfa', '#06d6e0']}
              bg="radial-gradient(ellipse 80% 50% at 50% 0%, rgba(236,72,153,0.4), transparent 70%), #0c0820" />
            <ThemeCard T={T} name="Paper" id="paper" active={tweaks?.vibe === 'paper'}
              setTweak={setTweak}
              colors={['#d97706', '#3d6b41', '#475569']}
              bg="#f3eee3" />
            <ThemeCard T={T} name="Mono" id="mono" active={tweaks?.vibe === 'mono'}
              setTweak={setTweak}
              colors={['#22c55e', '#06b6d4', '#3b82f6']}
              bg="#0a0a0a" />
          </div>
        </Section>

        {/* Pairing code */}
        <Section T={T} title="Pair with parent">
          <div style={{
            margin: '0 16px', padding: '18px 16px', borderRadius: 16,
            background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)',
            border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
          }}>
            {parentPaired ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: T.green,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16,
                }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.fBody, fontSize: 15, fontWeight: 600, color: T.ink }}>
                    Paired with Mom
                  </div>
                  <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.sub, marginTop: 2 }}>
                    She sees your homework. You can unpair anytime.
                  </div>
                </div>
                <button style={{
                  background: 'transparent', border: 'none', color: T.rose,
                  fontFamily: T.fBody, fontSize: 13, cursor: 'pointer',
                }}>Unpair</button>
              </div>
            ) : (
              <>
                <MicroLabel T={T}>Your code</MicroLabel>
                <div style={{
                  fontFamily: T.fMono, fontSize: 34, fontWeight: 500, letterSpacing: 4,
                  color: T.ink, marginTop: 8, textAlign: 'center',
                }}>{code}</div>
                <div style={{
                  fontFamily: T.fBody, fontSize: 12.5, color: T.sub,
                  marginTop: 10, textAlign: 'center', lineHeight: 1.5,
                }}>Have a parent open the Parent app, tap "Pair with a kid", and enter this code.</div>
              </>
            )}
          </div>
        </Section>

        {/* Classes */}
        <Section T={T} title="Classes">
          <div style={{
            margin: '0 16px', borderRadius: 16, overflow: 'hidden',
            background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)',
            border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
          }}>
            <Row T={T} label="Edit classes" />
            <Row T={T} label="Class schedule" detail="Mon–Fri" />
            <Row T={T} label="Switch school" detail="Eric Hamber" last />
          </div>
        </Section>

        <Section T={T} title="Account">
          <div style={{
            margin: '0 16px', borderRadius: 16, overflow: 'hidden',
            background: T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)',
            border: `0.5px solid ${T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)'}`,
          }}>
            <Row T={T} label="Notifications" detail="On" />
            <Row T={T} label="Privacy" />
            <Row T={T} label="Help" last />
          </div>
          <div style={{ padding: '16px 16px 0' }}>
            <button onClick={onSignOut} style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'transparent', color: T.rose,
              fontFamily: T.fBody, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}>Sign out</button>
          </div>
        </Section>
      </div>
      <BottomNav T={T} onNav={onNav} active="profile" />
    </div>
  );
}

function ThemeCard({ T, name, id, active, setTweak, colors, bg }) {
  return (
    <button onClick={() => setTweak && setTweak('vibe', id)} style={{
      flex: 1, padding: 0, borderRadius: 14, cursor: 'pointer',
      border: `1.5px solid ${active ? T.magenta : T.surfaceEdge}`,
      background: 'transparent', overflow: 'hidden', textAlign: 'left',
      boxShadow: active && T.isTwilight ? `0 0 0 3px ${T.magenta}22, 0 0 18px ${T.magenta}44` : 'none',
      transition: 'all 180ms',
    }}>
      <div style={{
        height: 72, background: bg, position: 'relative',
        display: 'flex', alignItems: 'flex-end', padding: 8, gap: 4,
      }}>
        {colors.map((c, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%', background: c,
            boxShadow: `0 0 10px ${c}aa`,
          }} />
        ))}
        {active && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            width: 18, height: 18, borderRadius: '50%', background: T.magenta,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px ${T.magenta}`,
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12">
              <path d="M2 6.5L4.8 9 10 3.5" stroke="#fff" strokeWidth="2"
                fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div style={{
        padding: '8px 10px', background: T.surface,
        fontFamily: T.fBody, fontSize: 13, fontWeight: 600,
        color: active ? T.magenta : T.ink, letterSpacing: -0.1,
      }}>{name}</div>
    </button>
  );
}

function Stat({ T, label, value, accent }) {
  return (
    <div style={{
      flex: 1, padding: '14px 12px', borderRadius: 14, textAlign: 'center',
      background: accent
        ? (T.dark ? 'rgba(216,160,74,0.12)' : 'rgba(217,119,6,0.08)')
        : (T.dark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.6)'),
      border: `0.5px solid ${accent ? T.accent + '55' : (T.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.08)')}`,
    }}>
      <div style={{
        fontFamily: T.fDisplay, fontSize: 26, color: accent ? T.accentDk : T.ink, lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontFamily: T.fBody, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6,
        textTransform: 'uppercase', color: T.sub, marginTop: 5,
      }}>{label}</div>
    </div>
  );
}

function Section({ T, title, children }) {
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ padding: '0 24px 8px' }}>
        <MicroLabel T={T}>{title}</MicroLabel>
      </div>
      {children}
    </div>
  );
}

function Row({ T, label, detail, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 16px',
      borderTop: last ? 'none' : undefined,
      borderBottom: last ? 'none' : `0.5px solid ${T.dark ? 'rgba(255,255,255,0.05)' : 'rgba(28,25,23,0.05)'}`,
      cursor: 'pointer',
    }}>
      <span style={{ flex: 1, fontFamily: T.fBody, fontSize: 15, color: T.ink, letterSpacing: -0.1 }}>{label}</span>
      {detail && <span style={{ fontFamily: T.fBody, fontSize: 13.5, color: T.sub, marginRight: 6 }}>{detail}</span>}
      <span style={{ color: T.soft, fontSize: 14 }}>›</span>
    </div>
  );
}

Object.assign(window, { SocialScreen, ProfileScreen, AddFriendSheet, ThemeCard });
