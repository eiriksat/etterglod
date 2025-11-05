"use client";

/**
 * Minnetale for Ingvild
 * - Legend øverst
 * - Avsnitt merket [Marit] i rødt, [Eirik] i blått
 * - Fungerer i både light/dark mode
 */

export default function MinnetalePage() {
    return (
        <main className="p-6 max-w-3xl mx-auto space-y-8">
            {/* Legend */}
            <section className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-sm bg-zinc-50 dark:bg-zinc-900 text-center">
                <p>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">🩵 Eirik Sæther</span>
                    <span className="mx-3 text-zinc-400">•</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold">❤️ Marit Sæther</span>
                </p>
            </section>

            <article className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed"><article className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed space-y-6 sm:space-y-7 [&>p]:leading-8">
                <h1 className="text-center">Speech for Ingvild</h1>

                {/* INTRO */}
                <h2>Intro</h2>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    We knew this day would come. Those were Ingvild’s own words just a few weeks ago. The day
                    came earlier than we could hope, but later than we feared. Today we are here to remember
                    Ingvild, and to celebrate the life she so passionately lived.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    “My funeral shall be a Celebration of Life!” was Ingvild’s clear instruction. It became our
                    grateful task to fulfil that final wish. And we now extend that wish to all of you — that
                    together we create a bright and warm day that honours life itself.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    In the autumn of 2021, Ingvild was told she had cancer, likely shortening her life. It was
                    a serious message to receive, and she gathered those closest to her. But the focus was never
                    on the illness — it was on all the possibilities that still could be seized. It became a shift,
                    for Ingvild and for us around her. And because of that, we were fortunate to have so much
                    time together in the years that followed.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    The hedonist in Ingvild found new expression after the diagnosis became a fact. In later years,
                    the workload became a little lighter, leisure time a little greater, and priorities somewhat
                    different. As a family we travelled — a lot. London, Tokyo and New York with the whole gang;
                    Oslo, London, Trondheim, Stockholm, London again, Madrid, Paris, Milan, Bergen and Lisbon just
                    this past year. Lazy days at Rennesøy, Hovden and in Kristiansand. Pancakes after school,
                    outings, and countless restaurant visits. A glass of pink champagne in the blue hour, planning
                    the next shared meal.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    But there were also tough treatments, side effects, Teams meetings, planning and adapting work
                    schedules, researching studies and new therapies. Small challenges that gradually grew larger,
                    and last autumn became harder to combine with ordinary life. But through it all – no complaints,
                    always searching for solutions, never talk of “giving up or giving in” – only of making the best
                    of it and carrying on. We have done our best all the way, and we will continue to do so.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    That may be why her passing has come as a shock to many. She wanted to maintain normality within
                    the abnormal for as long as possible. Ingvild – and we – would like to thank the healthcare system
                    for excellent care from beginning to end, especially the oncology department at SUS. They quickly
                    realised they had a patient out of the ordinary when Ingvild held Teams meetings with an animated
                    office background during hospital rounds. She was a fighter. She never gave up, set herself new
                    goals, and had grit.
                </p>

                {/* CHILDHOOD */}
                <h2>Childhood</h2>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    Like us, Ingvild grew up in a safe and loving home, the big sister to two rather lively younger
                    siblings, with both parents working full-time – a solid, classic upbringing for its time. When our
                    father passed away last year, we talked about our childhood and agreed we were lucky to have grown up
                    in that family. “There’s been little fuss,” as Dad used to say.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    As a child, Ingvild was calm and quiet. Our mother recalls that when they were going to Sunday visits,
                    she would reluctantly agree to come, but announce: “They won’t hear a sound from me.” She enjoyed her
                    own company and her own projects. She was once invited to a costume party but hated dressing up. She
                    finally agreed to wear a sailor’s collar from Dad’s navy uniform, and went as a sailor. For a pet, she
                    chose an aquarium – and she was christened by the man who wrote <em>Her kjem Dampen</em> (“Here Comes the
                    Steamer”). Perhaps her fascination for the sea and ships began right there.
                </p>

                {/* CAREER */}
                <h2>Career</h2>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    For nearly four decades, Ingvild devoted herself to the maritime industry – through studies and a long
                    career. Leadership was her great passion, something that inspired her right to the end. She had shelves
                    full of books on the subject and, even in her final months, she watched every session from the autumn’s
                    Oslo Business Forum recordings.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    After completing her education at the shipping line in Kristiansand, she began her career at Det
                    Stavangerske Dampskibsselskab (DSD). She stayed there for nine years, also completing further studies at
                    the London School of Economics. Those years formed the foundation for the strong professional insight and
                    industry understanding that would carry her forward.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    When she joined Teekay in 2002, following the acquisition of Navion from Statoil, her career truly
                    accelerated. She held several senior leadership roles before being appointed President and CEO of what
                    we today know as Altera Infrastructure in 2017.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    As a leader, Ingvild was visionary – but always with her feet firmly on deck. She saw the people behind
                    the numbers and wanted everyone – whether they worked in offices, on ships, or offshore – to feel pride,
                    safety and belonging.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    She was a driving force for the green transition in maritime industries, combining strategic clarity with
                    genuine humanity. She believed in people, listened with curiosity, and had a rare ability to make others
                    believe in themselves.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    Those who worked with her describe her as brave, wise and unpretentious – a leader who inspired trust simply
                    by being herself. Something she could illustrate perfectly by parking her old, slightly tired VW Golf in the
                    CEO’s spot.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    It warms us deeply to see the response from colleagues, former colleagues and business partners following her
                    passing. Many have written to say what a special leader she was.
                </p>

                {/* SISTER */}
                <h2>Sister</h2>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    Ingvild’s life circumstances gave her the freedom to choose what to prioritise – and what not to. We know she
                    greatly appreciated being included in Marit’s and my families, whether for everyday meals or celebrations –
                    though often, naturally, on her own terms. The same applied to her closest circle of friends. There were many
                    generous dinner invitations at Ingvild’s home, and she was warmly included in family gatherings all around.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    And food, of course, belongs in this speech. Cinnamon buns and komler, oysters and cheese, lobster and porridge
                    – as long as it was homemade or expensive, it was approved. Preferably with a Georg Jensen tablecloth, freshly
                    rolled from Mother’s linen press, fine thin-stemmed glasses and always fresh flowers. Around Ingvild’s table,
                    many of us have been replenished in one way or another. The younger generation too learned her standards – that
                    cold cuts belong on a platter, and that store-bought jam is for people who don’t know better.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    The obituary described her as a “Super Aunt” – and that she truly was. Ingvild’s love for her nieces and nephews
                    was boundless. In recent years she devoted special attention to them and was deeply engaged in their lives –
                    sports, friends, school. She was not afraid of long philosophical discussions, and I think many of them could
                    talk openly with her about things they might not discuss at home.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    In a beautiful symbiosis, the children gave Ingvild the everyday joys of family life, while she gave them
                    perspective, the chance to see the world, and much shared laughter – whether at her home or at the cabin in
                    summer.
                </p>

                <p className="text-zinc-700 dark:text-zinc-300">
                    <em>It is a great loss for Maja, Albert, Erlend, Lærke and Anton that their aunt is gone. She will always have a
                        special place in their hearts.</em>
                </p>

                {/* DALE */}
                <h2>Dale</h2>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    A shared refuge for all of us is Dale on Rennesøy. There, Ingvild built her cabin in the same area as our
                    mother’s family farm – minimalist, contemporary, and with the fitting name <em>Champagneklosteret</em>
                    (“The Champagne Cloister”). If you walk up to Rennesøyhodnet, you pass it on your way – and there stands
                    Ingvild’s bench, made from a 200-year-old oak that once stood on the pier before a storm took it down.
                    Upright, enduring, and solid – just like its owner. Stop there for a rest next time you pass by.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    Ingvild loved being at Dale – hikes in the hills, swimming from the pier, plenty of food, plenty of wine, and
                    plenty of family. She was also the proud “shipowner” of M/S AMALIE – an acronym for Albert, Maja, Anton, Lærke,
                    Ingvild and Erlend – a boat she never captained except in the accounts.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    In many ways, Ingvild had the biggest family of us all – not only the AMALIE crew, but also the children of many
                    friends who were naturally included at Christmas and on special occasions.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    She had a wide circle of friends. Some she saw more often than others, and her friendships served different roles.
                    Some grew out of her professional life and provided room for good conversations about work and leadership, while
                    others were purely social – centred around good food, wine, and warmth.
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    We are deeply grateful to all who stood close to Ingvild, and a special thanks to Jorunn Løge, who has been an
                    exceptional support for Ingvild, for Marit and me, and for the rest of the family right to the end. It has meant
                    more than words can say.
                </p>

                {/* PERSONALITY & INTERESTS */}
                <h2>Personality &amp; Interests</h2>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    Ingvild focused on the big picture. She didn’t spend much energy keeping track of keys, wallets, headsets or
                    chargers. Her own explanation was that her mental capacity was reserved for more important things. She had a
                    “it will work out” attitude toward most practical matters – and usually it did. A notable exception was an
                    unplanned long stop in Lom with her new electric car, surprised to discover that charging stations were not
                    plentiful in Jotunheimen. Even the 50,000 dollars in cash she once left in an airplane’s hat rack on a flight
                    to South America eventually found its way back. It always worked out.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    She also had a gift for seeing the greatness in small things – in nature, in moments, and in people. Despite a
                    remarkable career and opportunities across the world, her roots remained strong – to Stavanger, to Dale, to
                    family and friends. She lived her life fully, and she felt she had lived a rich one.
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    To honour Ingvild’s spirit and her wish for a Celebration of Life, we chose to include “What a Wonderful World”
                    in today’s program. It feels almost poetic that we discovered yesterday that the song reached the top of the
                    charts in April 1968 – the very month Ingvild came into the world. Remember that next time you hear it.
                </p>

                {/* SONG LYRICS (Marit) */}
                <p className="text-red-600 dark:text-red-400 font-medium">
                    I see trees of green<br />
                    Red roses too<br />
                    I see them bloom<br />
                    For me and you<br />
                    And I think to myself<br />
                    What a wonderful world
                </p>

                <p className="text-red-600 dark:text-red-400 font-medium">
                    I see skies of blue<br />
                    And clouds of white<br />
                    The bright blessed day<br />
                    The dark sacred night<br />
                    And I think to myself<br />
                    What a wonderful world
                </p>

                {/* SONG LYRICS (Eirik) */}
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    The colors of the rainbow<br />
                    So pretty in the sky<br />
                    Are also on the faces<br />
                    Of people going by<br />
                    I see friends shaking hands<br />
                    Saying, &quot;How do you do?&quot;<br />
                    They&apos;re really saying<br />
                    I love you
                </p>

                <p className="text-blue-600 dark:text-blue-400 font-medium">
                    I hear babies cry<br />
                    I watch them grow<br />
                    They&apos;ll learn much more<br />
                    Than I&apos;ll ever know<br />
                    And I think to myself<br />
                    What a wonderful world
                    
                    
                </p>
            </article>
        </main>
    );
}