sed -i '/<p className="text-sm text-slate-600 mt-1">{event.message}<\/p>/c \
              {event.message && (\
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">\
                  {event.message.split(/(https?:\\\/\\\/[^\\s]+)/g).map((part: string, i: number) => \
                    part.match(/^https?:\\\/\\\//) ? (\
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline font-medium break-all">{part}</a>\
                    ) : (\
                      <span key={i}>{part}</span>\
                    )\
                  )}\
                </p>\
              )}' src/pages/Dashboard/OrderDetails.tsx
