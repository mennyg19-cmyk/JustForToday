/**
 * A Handbook for New Stoics — Massimo Pigliucci & Gregory Lopez
 * 52 week-by-week lessons. Each week: reading (lesson + exercise instructions) and daily practice (Mon–Sat) + weekly review.
 */

export type StoicPart = 'desire' | 'action' | 'assent';

export interface StoicWeek {
  week: number;
  title: string;
  part: StoicPart;
  /** Full lesson: scenario, ancient quote, explanation, then exercise instructions. */
  lesson: string;
  /** Short label for the daily prompt (e.g. "Event + Control columns") */
  dailyPromptLabel?: string;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const STOIC_DAY_KEYS = [...DAY_KEYS];
export const STOIC_REVIEW_DAY_KEY = 'review';

function week(
  week: number,
  title: string,
  part: StoicPart,
  lesson: string,
  dailyPromptLabel?: string
): StoicWeek {
  return { week, title, part, lesson, dailyPromptLabel };
}

/** All 52 weeks with full lesson text (scenario, ancient text, explanation, exercise) aligned with the handbook structure. */
export const STOIC_HANDBOOK: StoicWeek[] = [
  // —— Week 1 ——
  week(
    1,
    "Discover what's really in your control, and what's not",
    'desire',
    `**Scenario**  
It's easy to think that we have control over our lives when things are going the way we want. But what happens when we experience uncertainty? Consider Alice, whose quarterly performance review is coming up. Though she's been doing well, anxiety floods her as negative what-if scenarios cross her mind. Could learning what's really in her control help?

**Ancient text (Epictetus, Enchiridion 1)**  
"Of all existing things some are in our power, and others are not in our power. In our power are thought, impulse, will to get and will to avoid, and, in a word, everything which is our own doing. Things not in our power include the body, property, reputation, office, and, in a word, everything which is not our own doing."

**Explanation**  
This is the "dichotomy of control"—central to Stoic practice. Epictetus divides the world into (1) what is under our *complete* control and (2) what is not. Under our control: our judgments, impulses, and will (what we desire or wish to avoid). Not under our control: body, property, reputation, outcomes. We train to focus desire and aversion only on what we control, so we can approach serenity (ataraxia).

**This week's exercise**  
Choose a time each day (e.g. after your evening routine). Monday through Saturday, pick something that happened that day—preferably not too emotionally charged. Write a brief description of the event, then list what was *completely in your control* and what *wasn't*. Use Epictetus's hints: value judgments, impulses, and what you wished to obtain or avoid are in your control; external results and many bodily/automatic reactions are not. Add short reasons why each item was or wasn't in your complete control.

**Why this exercise**  
By doing this daily on specific events, you start to internalize what is really under your control and what isn't. That prepares you to focus your desires and aversions where they can actually bring peace of mind.`,
    'Event + Complete control / Incomplete control'
  ),

  // —— Week 2 ——
  week(
    2,
    'Focus on what is completely in your control',
    'desire',
    `**Scenario**  
At some point you've tried to prevent something from happening, but it happened anyway. Do you remember how upset you were? If you did everything in your power to prevent it, why were you upset? Suki is terrified after her doctor referred her to a cardiologist. Let's explore why she's upset and what can be done.

**Ancient text (Epictetus, Enchiridion 2)**  
"Remember that following desire promises the attainment of that of which you are desirous; and aversion promises the avoiding that to which you are averse. However, he who fails to obtain the object of his desire is disappointed, and he who incurs the object of his aversion wretched. If, then, you confine your aversion to those objects only which are contrary to the natural use of your faculties, which you have in your own control, you will never incur anything to which you are averse. But if you are averse to sickness, or death, or poverty, you will be wretched. Remove aversion, then, from all things that are not in our control, and transfer it to things contrary to the nature of what is in our control."

**Explanation**  
Much suffering comes from a disconnect between what you want and what actually happens. Epictetus says: don't be averse to poverty, illness, or death—they're outside complete control. Redirect aversion *away* from what you can't control and *toward* what you can (e.g. your judgments and choices). Same for desire: desire not "to get the promotion" but "to put forward the best case and do my best." Then you cannot fail in the only sense that matters.

**This week's exercise**  
(1) Look back at last week's "Incomplete control" column and note things you were *averse* to. (2) For each, look at your "Complete control" column: what in your control preceded that aversion? (3) Set a 3‑minute timer and brainstorm how the things in your control could have led to the aversion. (4) Set another 3 minutes and list ways to *transfer* aversion from external things to things you can completely control (e.g. "remind myself my thoughts are causing the upset"). Each day this week, set a 3‑minute timer, review that list, and choose one thing to practice that day.`,
    'Daily practice: review list and choose one to practice'
  ),

  // —— Week 3 ——
  week(
    3,
    'Take an outside view',
    'desire',
    `**Scenario**  
Robert has always been the person others turn to for comfort, but as his own life has become stressful he finds it hard to gain the same perspective on his own troubles. This exercise helps by adopting an outside view of our own situation.

**Ancient text (Epictetus, Enchiridion 26)**  
"It is in our power to discover the will of nature from those matters on which we have no difference of opinion. For example, when another man's slave has broken the wine cup, we are very ready to say at once, 'Such things must happen.' Know then that when your own cup is broken, you ought to behave in the same way as when your neighbor's was broken. Apply the same principle to higher matters. Is another's child or wife dead? Not one of us but would say, 'Such is the lot of man'; but when one's own dies, straightaway one cries, 'Alas! miserable am I.' But we ought to remember what our feelings are when we hear it of another."

**Explanation**  
We tend to *self*-empathize ("Alas! Miserable am I") but *sympathize* with others ("Such is the lot of man"). The Stoics suggest cultivating sympathy (reason-based care) more than empathy (sharing the emotion). Taking an outside view doesn't mean being callous—it means being more reasonable. When we give ourselves advice as if we were a friend, we often find equanimity.

**This week's exercise**  
Set a time each day (e.g. at night). Set a 5‑minute timer. Write about either a problem you had today or a worry about tomorrow. Use *second person* or your name—e.g. "You feel nervous about…" or "Rob, you're juggling a lot…"—and give yourself advice and comfort from that outside perspective. Write until the timer goes off.`,
    '5 min: problem or worry in second person + advice'
  ),

  // —— Week 4 ——
  week(
    4,
    "Take another's perspective",
    'desire',
    `**Scenario**  
Felix has been waiting in line at the bank forever. The teller curtly says the system is down. Felix thinks, "Why the hell did he talk to me like that?!" He doesn't consider that the teller has been dealing with frustrations all morning. This week's exercise helps cut off such anger.

**Ancient text (Marcus Aurelius, Meditations 7.26)**  
"Does a man do you a wrong? Go to and mark what notion of good and evil was his that did the wrong. Once you perceive that… you will feel compassion, not surprise or anger. For you have still yourself either the same notion of good and evil as he, or another not unlike it. You need to forgive him then. But if your notions of good and evil are no longer such, all the more easily shall you be gracious to him that sees awry."

**Explanation**  
When someone wrongs us we tend to see their actions as reflecting their character and ours as depending on circumstances (the "fundamental attribution error"). Marcus suggests: (1) Figure out what *notion of good and evil* led them to act that way. (2) Ask whether we sometimes have similar values; if we do, we might fault ourselves instead of only them. (3) Either way, we can feel compassion or pity rather than anger. We're not required to agree—only to give their perspective a fair hearing.

**This week's exercise**  
At a set time each day, think of someone who frustrated you or whom you felt did you wrong. (1) Who was it? What did they do? Why do you feel wronged? (2) Why might they have acted that way? What values make sense of their actions? (3) Do you, or did you, hold any of those values? If yes, write about a time you acted on them. If no, list traits you value and how you could use them to lower frustration. (4) How do you feel about this person now?`,
    'Reflection: someone who frustrated you + their perspective'
  ),

  // —— Week 5 ——
  week(
    5,
    'Strengthen yourself through minor physical hardships',
    'desire',
    `**Scenario**  
Henry often works through lunch and ends up grumpy and unable to focus. Physical discomfort (hunger, cold, tiredness) can lead to emotional upset. The Stoics practiced mild self-imposed discomfort to strengthen character and resilience.

**Ancient text (Musonius Rufus, Lectures 6)**  
"There are two kinds of training, one for the soul alone and one common to soul and body. We use the training common to both when we discipline ourselves to cold, heat, thirst, hunger, meager rations, hard beds, avoidance of pleasures, and patience under suffering. By these the body is strengthened and the soul trained for courage and self-control."

**Explanation**  
The mind and body influence each other. Practice mild discomfort (e.g. cold without a coat, skipping dessert, a longer line at checkout) so that when hardship comes by circumstance, you're already used to the idea that discomfort is manageable. Choose something that happens often and that, if you were resilient to it, would improve your life. Rate difficulty 3–5 out of 10: doable but stretching.

**This week's exercise**  
List areas where physical discomfort tends to trigger emotional distress. Choose one type to work on this week and make an action plan (e.g. smaller lunches, or one cold shower). Each day, expose yourself to that discomfort as planned and note briefly how it went and what you noticed.`,
    'Daily: minor hardship + brief note'
  ),

  // —— Week 6 ——
  week(
    6,
    "Consider what you want your life to be",
    'desire',
    `**Scenario**
Maria has a good job and a comfortable routine, but she often feels that something is missing. She hasn't asked herself what kind of life she actually wants to live. Clarifying our life goals in line with what we can control helps us direct our desires wisely.

**Ancient text (Epictetus, Discourses)**  
"We are not to have our desires fixed upon any one thing that is outside our control; if we do, we must of necessity be disappointed."

**Explanation**
Stoics urge us to align our desires with a life lived according to reason and virtue—not with external markers of success. Reflecting on what we want our life to *be* (our character, our choices) rather than what we want to *get* (wealth, status) keeps our goals within the sphere we can influence.

**This week's exercise**
Each day, set aside time to write. (1) Describe in a few sentences the kind of person you want to be and the kind of life you want to be living, focusing on character and choices, not outcomes. (2) List one thing you did today that moved you toward that vision and one thing that pulled you away. (3) Note what is in your control in each.`,
    'Daily: life vision + one step toward / away'
  ),

  // —— Week 7 ——
  week(
    7,
    'Remind yourself of the impermanence of things',
    'desire',
    `**Scenario**
James is attached to his current job and his neighborhood. When he imagines losing either, he feels anxious. The Stoics practiced reflecting on impermanence not to be gloomy, but to value the present and reduce clinging to what cannot last.

**Ancient text (Marcus Aurelius, Meditations 4.32)**  
"Thou hast embarked, thou hast made the voyage, thou art come to port. Disembark. If indeed for another life, there are gods even there. If for nothingness, thou wilt be delivered from pain and from pleasure."

**Explanation**
Everything we have and everyone we love is on loan. Reminding ourselves of this softens both the fear of loss and the grip of desire for more. We can enjoy things *while* holding them lightly—which is the heart of the discipline of desire.

**This week's exercise**
Once per day, pick one thing you value (a relationship, your health, a possession, your job). Write: "This will not last forever." Then write how you would treat it today if you knew it might be gone soon—without dramatizing, just with clearer appreciation and less clinging.`,
    'Daily: one valued thing + impermanence + how to treat it today'
  ),

  // —— Week 8 ——
  week(
    8,
    'Reflect on the sage',
    'desire',
    `**Scenario**
When Emma faces a setback, she sometimes thinks, "What would a wise person do?" That question shifts her from reacting to choosing. The Stoics used the ideal of the sage—the fully rational person—as a guide, not a standard we must reach.

**Ancient text (Epictetus, Enchiridion 29)**  
"No one can make you accept what is false; your assent is in your power. When we are impeded or disturbed, let us never blame others, but ourselves—that is, our own judgments."

**Explanation**
The sage is someone who consistently judges rightly, desires only what is in their control, and acts with justice. We don't have to be sages; we use the image to correct our judgments. "What would the sage desire here? What would they avoid?"

**This week's exercise**
Each day, choose one situation (past or upcoming) where your desires or aversions were strong. Write: (1) What you wanted or feared. (2) What the sage would want or fear in that situation (only what is in their control). (3) One small adjustment you can make in your own desires or aversions to move closer to that.`,
    'Daily: situation + sage’s desire/aversion + your adjustment'
  ),

  // —— Week 9 ——
  week(
    9,
    'Practice voluntary discomfort',
    'desire',
    `**Scenario**
Leo avoids cold, hunger, and inconvenience whenever he can. When they happen anyway, he gets irritable. The Stoics practiced voluntary discomfort so that when life brings it, they were already used to the idea that it is bearable.

**Ancient text (Seneca, Letters 18)**  
"Set aside a certain number of days during which you will be content with the scantiest and cheapest fare, with coarse and rough dress, saying to yourself the while: 'Is this the condition that I feared?'"

**Explanation**
Voluntary discomfort—cold showers, simpler meals, fewer comforts—is not punishment. It trains us to see that our well-being does not depend on external ease. We strengthen our capacity to keep our desires and aversions within reason.

**This week's exercise**
Choose one form of voluntary discomfort (e.g. cooler shower, skipping a treat, walking instead of driving, less screen time). Practice it at least once each day. Write briefly what you noticed: physical sensation, resistance, and whether your mind stayed calm.`,
    'Daily: one voluntary discomfort + brief note'
  ),

  // —— Week 10 ——
  week(
    10,
    'Remind yourself of the view from above',
    'desire',
    `**Scenario**
Nina gets caught up in daily worries—traffic, emails, small slights. When she imagines looking at the earth from above, her problems feel smaller and more manageable. The "view from above" is a Stoic visualization to reduce the weight we give to passing troubles.

**Ancient text (Marcus Aurelius, Meditations 9.30)**  
"Look at the past—great empires falling—and the future too. And see how many are now ignorant of your very name, and how many will soon forget it."

**Explanation**
From a cosmic or historical perspective, our concerns shrink. That doesn't mean they're trivial—it means we can hold them in proportion. We desire and fear less when we see our place in the larger whole.

**This week's exercise**
Once per day, close your eyes (or write) and take the view from above. Imagine the earth from space, then your country, then your city, then your room—and yourself in it. Then reverse: you in the room, in the city, on the earth, in the cosmos. Note one desire or aversion that feels smaller after this.`,
    'Daily: view from above + one desire/aversion that shrinks'
  ),

  // —— Week 11 ——
  week(
    11,
    'Contemplate the ideal human',
    'desire',
    `**Scenario**
David wants to be a good parent and colleague but often defaults to comfort and approval-seeking. Reflecting on the ideal human—the person living by reason and virtue—helps him aim his desires at what actually improves his character.

**Ancient text (Epictetus, Discourses)**  
"Who is the invincible human? The one who can be disconcerted by nothing that lies outside the sphere of choice."

**Explanation**
The ideal human is not perfect but is guided by wisdom, courage, justice, and temperance. They desire to act well, not to get rewards. By contemplating this ideal, we recalibrate what we wish for and what we wish to avoid.

**This week's exercise**
Each day, write a short description of the ideal human in one situation you faced or will face (e.g. receiving criticism, facing a delay). What would they want? What would they avoid? Then write one way you can align your own desire or aversion with that ideal today.`,
    'Daily: ideal human in one situation + one alignment'
  ),

  // —— Week 12 ——
  week(
    12,
    'Examine your desires and aversions',
    'desire',
    `**Scenario**
Priya notices she spends a lot of mental energy wanting praise and avoiding conflict. She hasn't systematically examined whether those desires and aversions serve her. This week we turn a clear eye on what we want and what we run from.

**Ancient text (Epictetus, Enchiridion 2)**  
"Remember that following desire promises the attainment of that of which you are desirous; and aversion promises the avoiding that to which you are averse. If you confine your aversion to those objects only which are contrary to the natural use of your faculties, which you have in your own control, you will never incur anything to which you are averse."

**Explanation**
Not every desire is bad—but we suffer when we desire what we can't control. Same for aversion: we suffer when we're averse to things outside our control. Examining them honestly lets us transfer desire and aversion to what is up to us.

**This week's exercise**
Each day, list 2–3 things you desired and 2–3 things you were averse to. For each, note: Was it in your complete control? If not, write a short sentence redirecting that desire or aversion to something in your control (e.g. "I want to do my best" instead of "I want to win").`,
    'Daily: desires/aversions + control check + redirect'
  ),

  // —— Week 13 ——
  week(
    13,
    'Practice the dichotomy of control in reverse',
    'desire',
    `**Scenario**
Usually we start from an event and ask what was in our control. This week we flip it: we start from our *reactions* and ask what we assumed was in or out of our control. Tom often feels helpless; reversing the dichotomy shows him where he's given away his agency.

**Ancient text (Epictetus, Enchiridion 1)**  
"In our power are thought, impulse, will to get and will to avoid, and, in a word, everything which is our own doing."

**Explanation**
When we're upset, we're often treating something as if it were in our control (and we failed) or as if we had no control at all (and we're helpless). Asking "What did I assume was in my control? What did I assume wasn't?" restores clarity and choice.

**This week's exercise**
When something bothers you (or at day's end), write: (1) What was your reaction? (2) What did you implicitly assume was in your control? (3) What did you assume was not? (4) Correct the assumptions using the dichotomy—then note one thing that *is* in your control in this situation.`,
    'Daily: reaction + assumptions about control + correction'
  ),

  // —— Week 14 ——
  week(
    14,
    'Reflect on the unity of all things',
    'desire',
    `**Scenario**
Luis tends to see himself as separate from others and from nature. When he reflects that we're all part of one rational whole—a Stoic idea—his desire to fight reality softens. He can want to act well within the whole rather than to have the whole be different.

**Ancient text (Marcus Aurelius, Meditations 4.40)**  
"All things are intertwined, and the bond is sacred; and scarcely anything is alien to another. For they have been arranged together in their places and together make the one ordered universe."

**Explanation**
Stoics saw the cosmos as a single, rational, interconnected whole. Reflecting on this doesn't erase our goals—it puts them in context. We're part of something larger; our desires can align with acting as a part of that whole rather than against it.

**This week's exercise**
Once per day, bring to mind the idea that everything is connected in one ordered whole. Write: (1) One way you felt separate or at odds with "how things are" today. (2) How might that situation look if you saw it as part of a single, interconnected order? (3) One desire you could adjust so it fits better with that view.`,
    'Daily: separation + unity view + one adjusted desire'
  ),

  // —— Week 15 ——
  week(
    15,
    'Remind yourself of impermanence',
    'desire',
    `**Scenario**
We already practiced impermanence in Week 7. This week we go deeper: we apply it specifically to the things we *most* want to keep and the things we *most* want to avoid. Anna holds tightly to her role as "the one who fixes things"; remembering impermanence helps her loosen that grip.

**Ancient text (Marcus Aurelius, Meditations 10.31)**  
"Think of the life you have lived until now, and of the life that is left; and of how much is the same in the lives of those who lived before you and those who will come after."

**Explanation**
Repeated, gentle reflection on "this too will change" reduces both craving and dread. We're not trying to stop caring—we're caring without clinging, so our desires and aversions stay proportionate.

**This week's exercise**
Each day, pick the thing you're most attached to (or most afraid of losing) in this phase of your life. Write that it is temporary. Then write how you would treat it today—and what you would do with your agency—if you fully accepted that it won't last forever.`,
    'Daily: one strong attachment + impermanence + how to act today'
  ),

  // —— Week 16 ——
  week(
    16,
    'Keep your peace of mind in mind',
    'desire',
    `**Scenario**
Omar says he wants to be calm, but he keeps saying yes to every request and chasing every opportunity. His real desire gets buried. This week we make peace of mind an explicit goal and check our other desires against it.

**Ancient text (Epictetus, Enchiridion 29)**  
"The essence of the good is a certain disposition of the will; and the essence of the bad is a certain disposition of the will. What then are externals? They are materials for the will."

**Explanation**
If we value peace of mind (ataraxia), we must desire and avoid in ways that don't undermine it. That means confining desire and aversion to what is in our control. Keeping "peace of mind" in mind is a filter for our choices.

**This week's exercise**
Each day, state in one sentence what would count as "peace of mind" for you today. Then list one or two things you desired or avoided that either supported or threatened that peace. For any that threatened it, write one way to redirect that desire or aversion so it supports peace of mind instead.`,
    'Daily: peace of mind + desires/aversions that help or hinder'
  ),

  // —— Week 17 ——
  week(
    17,
    'Act for the common welfare',
    'desire',
    `**Scenario**
The discipline of desire is about what we want and don't want. But the Stoics also held that we're social beings: our good is tied to the common welfare. This week we connect our desires to the good of others—not as an afterthought, but as part of what we want.

**Ancient text (Marcus Aurelius, Meditations 9.23)**  
"One thing is of use to one creature, another to another. For the vine, the tending that fits it. For the ox, its own. And for the human being, the tending that fits the human: the rational care of the political community."

**Explanation**
We're made to live with others. So desiring to act for the common welfare—family, friends, community, humanity—is in line with our nature. This doesn't replace the dichotomy of control; it shapes what we *want* to do with what is in our control.

**This week's exercise**
Each day, identify one situation where you could act for the benefit of others (even in a small way). Write what you did or plan to do, and how it connects to the common welfare. Then note: was your *desire* aligned with that action, or did you act out of duty while wanting something else? If the latter, write one way to align your desire with the common good.`,
    'Daily: one action for common welfare + desire alignment'
  ),

  // —— Discipline of Action (Weeks 18–35) ——

  // —— Week 18 ——
  week(
    18,
    'Practice acting with reserve',
    'action',
    `**Scenario**
Sandra pushes hard for outcomes—she must get the promotion, the deal must close. When it doesn't go her way, she's crushed. The Stoics practiced "reserve" (hupexairesis): do your best while holding in mind that the outcome is not fully in your control.

**Ancient text (Epictetus, Enchiridion 2)**  
"Make the best use of what is in your power, and take the rest as it happens."

**Explanation**
Acting with reserve means trying wholeheartedly while inwardly "reserving" the result. You aim to act well; you don't stake your well-being on the outcome. This is the discipline of action applied to how we pursue goals.

**This week's exercise**
Each day, choose one goal or task (e.g. a conversation, a project, a request). Write: (1) What you will do that is in your control. (2) What outcome you hope for but do not control. (3) One sentence reserving that outcome: "I will do my part; the result is not entirely up to me." Then act, and later note how you felt during and after.`,
    'Daily: one goal + reserve clause + note after'
  ),

  // —— Week 19 ——
  week(
    19,
    'Reflect on your roles',
    'action',
    `**Scenario**
Chris is a parent, a colleague, a friend, and a citizen. He often acts on autopilot instead of asking what each role requires. The Stoics stressed that we have multiple roles and that acting well means fulfilling each appropriately.

**Ancient text (Epictetus, Discourses 2.10)**  
"Remember that you are an actor in a play, and the playwright chooses the kind of play it is… Your job is to play your assigned part well."

**Explanation**
We don't choose all our roles, but we can choose how we fill them. Reflecting on our roles—parent, worker, friend, citizen—helps us act with justice and care rather than habit or selfishness.

**This week's exercise**
Each day, list 2–3 of your main roles. For one role, write: What does this role ask of me today? What did I do well in that role? What could I do better? Then choose one concrete action for tomorrow in that role.`,
    'Daily: roles + one role reflection + one action'
  ),

  // —— Week 20 ——
  week(
    20,
    'Practice the view from above',
    'action',
    `**Scenario**
In Week 10 we used the view from above for the discipline of desire. Here we use it for action: seeing our place in the whole reminds us that our actions matter in a larger context—we're part of a community and a cosmos.

**Ancient text (Marcus Aurelius, Meditations 12.24)**  
"Three relations: one to the body that surrounds you; one to the divine cause from which all things come; one to those who live with you."

**Explanation**
From above, we see ourselves as one among many, dependent on nature and others. That perspective can guide action: we act not as the center of the universe but as a part of it, with responsibility toward the whole.

**This week's exercise**
Once per day, do the view-from-above visualization (earth, country, city, you). Then ask: In that vast picture, what is one action I can take today that fits my role in the whole? Write it and, if possible, do it. Note afterward how it felt to act from that perspective.`,
    'Daily: view from above + one fitting action'
  ),

  // —— Week 21 ——
  week(
    21,
    'Reflect on your place in the whole',
    'action',
    `**Scenario**
Maya sometimes feels insignificant or, conversely, that everything depends on her. Reflecting on her place in the whole—part of nature, part of humanity—helps her act with both humility and purpose.

**Ancient text (Marcus Aurelius, Meditations 6.44)**  
"All things are mutually intertwined, and the bond is holy; and there is hardly anything unconnected with any other thing."

**Explanation**
We are one part of a connected whole. That implies we have a place and a responsibility—we're not nothing, and we're not everything. Our actions should reflect that: contributing, not dominating; caring, not indifferent.

**This week's exercise**
Each day, write: (1) One way you are connected to others or to nature. (2) One action you took or will take that honors that connection. (3) One way you might have acted that would have ignored or harmed that connection—and how you'll avoid that next time.`,
    'Daily: connection + one honoring action + one to avoid'
  ),

  // —— Week 22 ——
  week(
    22,
    'Practice acting for the common welfare',
    'action',
    `**Scenario**
In Week 17 we linked *desire* to the common welfare. This week we focus on *action*: actually doing something each day that benefits others or the community, however small.

**Ancient text (Marcus Aurelius, Meditations 9.23)**  
"For the human being, the tending that fits the human: the rational care of the political community."

**Explanation**
The discipline of action is about living well with others. That means not only avoiding harm but actively contributing—listening, helping, participating. We practice by making "common welfare" a daily intention.

**This week's exercise**
Each day, choose one concrete action for the common welfare (help someone, volunteer, speak up for fairness, reduce waste, etc.). Write what you did and whom it benefited. Note any resistance or excuse you had to set aside.`,
    'Daily: one action for common welfare + note'
  ),

  // —— Week 23 ——
  week(
    23,
    'Reflect on the ideal human',
    'action',
    `**Scenario**
We reflected on the ideal human in Week 11 for desire. Here we ask: What would the ideal human *do* in my situation? That question guides our actions toward justice, courage, and kindness.

**Ancient text (Epictetus, Enchiridion 30)**  
"Duties are generally measured by relations. Is someone a father? Then take care of him as a father. A brother? Then care for him as a brother."

**Explanation**
The ideal human acts according to role and circumstance—with appropriate respect, honesty, and courage. We don't need to be perfect; we use the ideal as a compass for what to do next.

**This week's exercise**
Each day, pick one situation where you had to act (or will have to). Write: What would the ideal human do here? Then write what you did or plan to do. If there's a gap, write one small step to close it.`,
    'Daily: situation + ideal action + your action + gap'
  ),

  // —— Week 24 ——
  week(
    24,
    'Premeditate on encountering difficult people',
    'action',
    `**Scenario**
Jordan dreads meetings with a critical colleague. By the time they meet, Jordan is already defensive. Premeditation—rehearsing in advance how to act with patience and fairness—helps us act well when we face difficulty.

**Ancient text (Marcus Aurelius, Meditations 8.59)**  
"When you wake in the morning, tell yourself: the people I will meet today will be meddling, ungrateful, arrogant… I cannot be harmed by any of them, for no one can fix on me what is ugly."

**Explanation**
We can't control others, but we can prepare our response. Premeditation isn't pessimism—it's readiness. We decide in advance to act with virtue so that when the difficult person appears, we're not at the mercy of impulse.

**This week's exercise**
Each day, identify one person or situation you find difficult. Write: (1) What they might do or say. (2) How you will respond—with patience, fairness, and reserve. (3) One phrase or attitude you will hold in mind (e.g. "This is their judgment; my job is to act well"). If you encounter them, note how it went.`,
    'Daily: difficult person + planned response + outcome'
  ),

  // —— Week 25 ——
  week(
    25,
    'Practice acting with reserve in social situations',
    'action',
    `**Scenario**
In Week 18 we practiced reserve for goals. This week we apply it to social situations: we want to be liked, to persuade, to avoid conflict—but those outcomes aren't fully in our control. We act well and reserve the rest.

**Ancient text (Epictetus, Enchiridion 23)**  
"If you want to improve, be content to be thought foolish and stupid with regard to externals."

**Explanation**
In social situations we often strain for a particular result (approval, agreement). Acting with reserve means doing what is right—being honest, kind, fair—without needing a specific reaction from others. We control our action; we reserve their response.

**This week's exercise**
Each day, choose one social situation (meeting, conversation, message). Write: (1) What you will do or say that is in your control. (2) What reaction you hope for but don't control. (3) Your reserve clause. Then act. Later, note whether you stayed focused on your action rather than on controlling the outcome.`,
    'Daily: social situation + reserve + note'
  ),

  // —— Week 26 ——
  week(
    26,
    'Reflect on your place in the human community',
    'action',
    `**Scenario**
We're not isolated individuals; we're members of the human community. Reflecting on that membership can shift how we act—toward more cooperation, less rivalry; more empathy, less indifference.

**Ancient text (Marcus Aurelius, Meditations 10.6)**  
"Either the gods have no power, or they have power. If they have no power, why pray? If they have power, why not pray for the ability to avoid fear and desire, rather than for things that excite fear and desire?"

**Explanation**
Our place in the human community implies duties: to treat others as fellow rational beings, to contribute to shared life, to avoid harming the common good. This week we make that explicit and act on it.

**This week's exercise**
Each day, write: (1) One way you are part of the human community (work, family, neighborhood, society). (2) One obligation that comes with that membership. (3) One action you took or will take to honor that obligation.`,
    'Daily: community + obligation + one action'
  ),

  // —— Week 27 ——
  week(
    27,
    'Practice the discipline of action',
    'action',
    `**Scenario**
We've been building the discipline of action—reserve, roles, common welfare, view from above. This week we practice it as a whole: in each situation, ask what action fits my roles, serves the whole, and is within my control.

**Ancient text (Epictetus, Discourses 2.10)**  
"What is the profession of a citizen? To treat nothing as a private interest, to deliberate about nothing as though one were a separate unit."

**Explanation**
The discipline of action is the Stoic practice of acting for the common welfare, with reserve, in line with our roles. We don't act for private advantage at the expense of others; we act as part of a whole.

**This week's exercise**
Each day, pick 2–3 actions you took. For each, ask: Did I act with reserve? Did I consider my roles? Did I consider the common welfare? Write one sentence per action. For one action that fell short, write one way to do better next time.`,
    'Daily: 2–3 actions + reserve/roles/welfare check'
  ),

  // —— Week 28 ——
  week(
    28,
    'Reflect on your character',
    'action',
    `**Scenario**
Our actions shape and reveal our character. This week we reflect on the kind of character we're building—and whether our actions align with the person we want to be.

**Ancient text (Epictetus, Enchiridion 29)**  
"The essence of the good is a certain disposition of the will."

**Explanation**
Character is formed by repeated choices. If we want to be just, we must act justly; if we want to be courageous, we must act with courage. Reflecting on our character helps us spot gaps and align action with virtue.

**This week's exercise**
Each day, name one virtue you're working on (e.g. patience, honesty, courage). Write: (1) One action today that reflected that virtue. (2) One situation where you fell short. (3) One thing you will do tomorrow to strengthen that virtue.`,
    'Daily: one virtue + one good action + one shortfall + tomorrow'
  ),

  // —— Week 29 ——
  week(
    29,
    'Review your actions nightly',
    'action',
    `**Scenario**
The Stoics practiced nightly review: looking back at the day and asking what they did well and what they could improve. This isn't self-punishment—it's a way to learn and to commit to better action tomorrow.

**Ancient text (Seneca, On Anger 3.36)**  
"I will keep a watch over myself and—why not say it?—I will make a daily audit of myself."

**Explanation**
A brief nightly review turns the day into a lesson. We ask: What did I do well? What did I do poorly? What will I do differently? This habit reinforces the discipline of action over time.

**This week's exercise**
Each night, set aside 5 minutes. Write: (1) One action you're glad you took. (2) One action you regret or could have done better. (3) One resolution for tomorrow (concrete and small). Do this every day this week.`,
    'Nightly: one good action + one to improve + tomorrow\'s resolution'
  ),

  // —— Week 30 ——
  week(
    30,
    'Practice the view from above (action)',
    'action',
    `**Scenario**
We've used the view from above for desire (Weeks 10, 20) and for our place in the whole (Week 21). This week we use it again to choose actions: from that perspective, what matters? What action fits?

**Ancient text (Marcus Aurelius, Meditations 4.3)**  
"Men seek retreats for themselves… But it is in the power of reason to retire into itself and to be at peace."

**Explanation**
From above, petty rivalries and selfish impulses look smaller. What often remains is: act justly, act for the common good, do your part. We use the visualization to filter our actions.

**This week's exercise**
Once per day, do the view-from-above (earth, country, city, you). Then write: (1) One action that would look good from that perspective. (2) One action that would look small or selfish. (3) Choose to do the first (or something like it) and note it.`,
    'Daily: view from above + one fitting action + one to avoid'
  ),

  // —— Week 31 ——
  week(
    31,
    'Reflect on the unity of humanity',
    'action',
    `**Scenario**
It's easy to see others as "them"—different, threatening, or irrelevant. Reflecting on the unity of humanity reminds us that we share reason and a common nature; our actions should reflect that kinship.

**Ancient text (Marcus Aurelius, Meditations 4.4)**  
"We are made for cooperation, like feet, like hands, like eyelids."

**Explanation**
Stoics held that humans share in reason and are meant to work together. When we act as if others are alien, we act against our nature. Reflecting on unity guides us toward cooperation and justice.

**This week's exercise**
Each day, think of one person or group you tend to see as "other." Write: (1) What we have in common (needs, reason, mortality). (2) One action you could take that treats them as part of the same humanity. (3) If you did it, note the outcome; if not, what held you back?`,
    'Daily: one "other" + commonality + one unifying action'
  ),

  // —— Week 32 ——
  week(
    32,
    'Practice acting for the common welfare (continued)',
    'action',
    `**Scenario**
We practiced acting for the common welfare in Weeks 17 and 22. This week we deepen the practice: we look for chances to act for the common good even when it's inconvenient or when no one is watching.

**Ancient text (Marcus Aurelius, Meditations 9.23)**  
"The rational care of the political community."

**Explanation**
"Political" here means the community of which we're part. Acting for the common welfare can be small: listening, helping, telling the truth, not wasting shared resources. We practice until it becomes natural.

**This week's exercise**
Each day, do at least one action for the common welfare that is a stretch—something you might have skipped (e.g. helping someone who doesn't thank you, speaking up when it's easier to stay silent). Write what you did and how it felt.`,
    'Daily: one stretch action for common welfare'
  ),

  // —— Week 33 ——
  week(
    33,
    'Reflect on the ideal human (action)',
    'action',
    `**Scenario**
We've reflected on the ideal human for desire (Week 11) and for action (Week 23). This week we focus again on action: in each situation, we ask what the ideal human would do and we close the gap.

**Ancient text (Epictetus, Enchiridion 30)**  
"Duties are generally measured by relations."

**Explanation**
The ideal human acts according to the relations at hand—parent, friend, citizen—with justice and kindness. We use this as a daily check: Am I acting as the ideal would, or am I cutting corners?

**This week's exercise**
Each day, pick the most important interaction or decision you had. Write: (1) What would the ideal human do? (2) What did you do? (3) If there's a gap, what one thing will you do differently next time?`,
    'Daily: key situation + ideal vs. actual + one change'
  ),

  // —— Week 34 ——
  week(
    34,
    'Premeditate on difficulties (action)',
    'action',
    `**Scenario**
In Week 24 we premeditated on difficult people. This week we premeditate on difficult *situations*—delays, setbacks, criticism—and decide in advance how we will act so we're not swept away by emotion.

**Ancient text (Seneca, Letters 91)**  
"Let the mind be prepared for all that can happen; it will then be calmer when things do happen."

**Explanation**
Premeditation of adversity doesn't make us gloomy; it makes us ready. We decide beforehand to act with patience, reserve, and fairness. When difficulty comes, we've already chosen our response.

**This week's exercise**
Each day, identify one difficulty you might face (today or this week). Write: (1) What might happen. (2) How you will act (with reserve, without blaming, with fairness). (3) One phrase to remember in the moment. If the difficulty occurs, note how it went.`,
    'Daily: possible difficulty + planned action + phrase'
  ),

  // —— Week 35 ——
  week(
    35,
    'Practice the discipline of action (synthesis)',
    'action',
    `**Scenario**
This week we synthesize the discipline of action: reserve, roles, common welfare, view from above, nightly review, and premeditation. We practice holding them together in daily life.

**Ancient text (Epictetus, Enchiridion 30)**  
"Perform the duties of your station."

**Explanation**
The discipline of action is a single practice with many facets. We act with reserve, in line with our roles, for the common welfare, with a view from above—and we review and premeditate. This week we do it all.

**This week's exercise**
Each day, (1) In the morning: premeditate one difficulty and set one intention for the common welfare. (2) During the day: act with reserve in at least one situation. (3) At night: review one action you're proud of and one you'll improve. Write briefly for each.`,
    'Daily: morning intention + reserve + nightly review'
  ),

  // —— Discipline of Assent (Weeks 36–52) ——

  // —— Week 36 ——
  week(
    36,
    'Catch and counter initial impressions',
    'assent',
    `**Scenario**
Reena gets a terse email and immediately feels offended. She's assented to the impression "They're being rude." The Stoics taught that we don't have to accept every first impression—we can pause, examine it, and assent only to what is reasoned.

**Ancient text (Epictetus, Enchiridion 1.5)**  
"Things themselves do not touch the soul, nor have they access to the soul; only our judgments enter the soul."

**Explanation**
Between the raw impression and our reaction comes assent—our agreement to a judgment. The discipline of assent is to catch that moment and counter hasty or false judgments. We don't suppress feelings; we question the thoughts that amplify them.

**This week's exercise**
Each day, pick one moment when you had a strong negative reaction. Write: (1) What was the initial impression? (2) What judgment did you assent to? (3) Is that judgment accurate or exaggerated? (4) What would a more reasoned judgment be? Practice pausing before assenting when you can.`,
    'Daily: one reaction + impression + judgment + counter'
  ),

  // —— Week 37 ——
  week(
    37,
    'Work with your impressions and impulses',
    'assent',
    `**Scenario**
We don't control the first appearance of an impression, but we can work with it. This week we practice noticing impressions (e.g. "This is unfair") and the impulses that follow (e.g. to snap back), then choosing whether to assent or to redirect.

**Ancient text (Epictetus, Enchiridion 10)**  
"It is not things that disturb people, but their judgments about things."

**Explanation**
Impressions and impulses are natural. What we control is whether we endorse them. We work *with* them by naming them, examining them, and either assenting to a corrected judgment or withholding assent until we've thought it through.

**This week's exercise**
Each day, notice at least one strong impression (e.g. desire, aversion, offense). Write: (1) The impression. (2) The impulse that followed. (3) Whether you assented or paused. (4) If you paused, what you chose to assent to instead.`,
    'Daily: impression + impulse + assent or pause'
  ),

  // —— Week 38 ——
  week(
    38,
    'Practice the discipline of assent',
    'assent',
    `**Scenario**
The discipline of assent is the third Stoic discipline: we train to give assent only to well-examined, accurate judgments. This week we practice it explicitly—catching ourselves before we run away with a thought.

**Ancient text (Epictetus, Discourses 1.1)**  
"We are not to accept a single impression without testing it, but to say to it: Wait, let me see who you are and where you come from."

**Explanation**
Assent is the gatekeeper. We don't have to believe every thought that pops up. We can say "wait," check the impression against reality and our values, and assent only to what deserves it. That is the core of the discipline of assent.

**This week's exercise**
Each day, set a few reminders to "check assent." When one goes off, notice your current thought or judgment. Write it down: (1) The thought. (2) Is it fully true? (3) What would be a more accurate or useful judgment? Do this at least once per day.`,
    'Daily: check assent + thought + more accurate judgment'
  ),

  // —— Week 39 ——
  week(
    39,
    'Keep basic Stoic concepts ever at hand',
    'assent',
    `**Scenario**
When stress hits, Sam forgets everything he's learned. The Stoics recommended keeping key ideas "at hand"—dichotomy of control, reserve, the view from above—so we can use them in the moment.

**Ancient text (Marcus Aurelius, Meditations 4.3)**  
"Remember these: what is the nature of the whole, and what is my nature; how the one is related to the other; and that no one can prevent me from saying and doing what is in accord with the whole of which I am a part."

**Explanation**
We rehearse core ideas so they're available when we need them. That way, when an impression hits, we have a framework: Is this in my control? Am I assenting to something unexamined? What would the view from above show?

**This week's exercise**
Each morning, write one Stoic idea you want to keep at hand today (e.g. "Only my judgment can harm me"). Refer to it when you're stressed. At night, note one time you used it (or could have used it) to correct your assent.`,
    'Daily: one idea at hand + one use (or missed use)'
  ),

  // —— Week 40 ——
  week(
    40,
    'Reflect on the ideal human (assent)',
    'assent',
    `**Scenario**
We've reflected on the ideal human for desire (Week 11) and action (Weeks 23, 33). For assent: What would the ideal human *think* or *judge* in this situation? That question helps us correct our judgments.

**Ancient text (Epictetus, Enchiridion 31)**  
"For the rational creature, to assent to a falsehood is against nature."

**Explanation**
The ideal human assents only to what is true and reasonable. They don't add drama or distortion. We use that standard to check our own judgments: Would the ideal human endorse this thought, or would they pause and correct it?

**This week's exercise**
Each day, pick one situation where your judgment was (or might be) harsh or skewed. Write: (1) Your current or likely judgment. (2) What would the ideal human judge? (3) One way to shift your assent toward that.`,
    'Daily: your judgment + ideal judgment + shift'
  ),

  // —— Week 41 ——
  week(
    41,
    'Practice premeditation of adversity',
    'assent',
    `**Scenario**
Premeditation isn't only for action (Weeks 24, 34)—it also trains assent. When we've already considered "What if X goes wrong?", we're less likely to assent to panic or despair when X happens. We've already thought it through.

**Ancient text (Seneca, Letters 91)**  
"Rehearse in your mind: exile, torture, war, shipwreck. So that when the time comes, nothing will strike you as unexpected."

**Explanation**
By imagining difficulties in advance, we reduce the shock and the rash assent to "This is unbearable." We prepare our judgments so that when adversity comes, we can assent to "This is hard but manageable" or "I can act well here" instead of catastrophe.

**This week's exercise**
Each day, choose one adversity you might face (small or large). Write: (1) What might happen. (2) What judgment would be unhelpful (e.g. "I can't handle this"). (3) What judgment would be more helpful (e.g. "I can do my part"). Rehearse the helpful judgment.`,
    'Daily: one possible adversity + unhelpful vs. helpful judgment'
  ),

  // —— Week 42 ——
  week(
    42,
    'Reflect on the unity of reason',
    'assent',
    `**Scenario**
Stoics held that reason is shared—we all have a spark of the same logos. When we reflect on that, we're less likely to assent to judgments that set us against others ("They're irrational") and more likely to seek understanding.

**Ancient text (Marcus Aurelius, Meditations 4.4)**  
"Reason is common to all; so therefore is reason in its commands. When we assent to common reason, we act in harmony with the whole."

**Explanation**
If reason is shared, then when someone disagrees, they're not simply "wrong"—they're using the same faculty we have, perhaps with different information or emphasis. That reflection can soften our assent to hostile or dismissive judgments.

**This week's exercise**
Each day, think of one person or opinion you're inclined to dismiss. Write: (1) What judgment you're tempted to assent to. (2) How might reason have led them to their view? (3) One way to assent to a more charitable or accurate judgment.`,
    'Daily: one disagreement + their reason + charitable assent'
  ),

  // —— Week 43 ——
  week(
    43,
    'Practice the view from above (assent)',
    'assent',
    `**Scenario**
We've used the view from above for desire and action. For assent: from that perspective, many of our agitated judgments look small. We practice using the view from above to *correct* our assent—to see our worries in proportion.

**Ancient text (Marcus Aurelius, Meditations 9.30)**  
"Look at the past—great empires falling—and the future too. And see how many are now ignorant of your very name."

**Explanation**
From above, we see how brief our moment is and how large the cosmos is. That can loosen our grip on judgments like "This is the end of the world" or "I must have everyone's approval." We assent instead to more proportionate thoughts.

**This week's exercise**
Once per day, when something bothers you, do the view-from-above (earth, history, you). Then write: (1) The judgment that was bothering you. (2) How it looks from that perspective. (3) A more proportionate judgment to assent to.`,
    'Daily: view from above + judgment + proportionate assent'
  ),

  // —— Week 44 ——
  week(
    44,
    'Reflect on the unity of all (assent)',
    'assent',
    `**Scenario**
When we see ourselves as part of one whole, our judgments often shift. We're less likely to assent to "I'm alone" or "They're the enemy." We're more likely to assent to "We're in this together" or "I can respond with care."

**Ancient text (Marcus Aurelius, Meditations 4.40)**  
"All things are intertwined, and the bond is sacred."

**Explanation**
The unity of all things isn't just a fact—it's a lens for our judgments. When we assent to it, we filter out some of the divisive or isolating thoughts we might otherwise endorse. This week we use that lens deliberately.

**This week's exercise**
Each day, notice one judgment that sets you apart from others or from "how things are." Write: (1) That judgment. (2) How would it change if you assented to "all things are intertwined"? (3) Try assenting to the revised judgment and note the effect.`,
    'Daily: one isolating judgment + unity-based revision'
  ),

  // —— Week 45 ——
  week(
    45,
    'Practice the discipline of assent (synthesis)',
    'assent',
    `**Scenario**
This week we bring together the discipline of assent: catching impressions, working with them, keeping key concepts at hand, using the ideal human and the view from above to correct our judgments. We practice the full cycle.

**Ancient text (Epictetus, Enchiridion 1.5)**  
"Only our judgments enter the soul."

**Explanation**
The discipline of assent is one practice with many tools: pause, examine, counter unhelpful judgments, assent to what is true and useful. This week we use all of them in concert.

**This week's exercise**
Each day, (1) Morning: choose one concept to keep at hand. (2) When something triggers a strong judgment: pause, name the impression, ask what the ideal human would assent to, and if helpful use the view from above. (3) At night: write one example of having corrected your assent.`,
    'Daily: concept + pause + one corrected assent'
  ),

  // —— Week 46 ——
  week(
    46,
    'Reflect on the three disciplines',
    'assent',
    `**Scenario**
We've completed the three disciplines: desire (what we want and avoid), action (how we act with others and the world), and assent (what we assent to). This week we reflect on how they work together and what we've learned.

**Ancient text (Epictetus, Discourses 3.2)**  
"There are three things: desire and aversion (that we get what we want and avoid what we don't); impulse and refusal (that we act rightly); and assent (that we not be deceived)."

**Explanation**
The three disciplines support each other. Clear assent reduces rash desire and impulsive action. Well-ordered desire makes it easier to act for the common welfare. Good action reinforces our judgments. We reflect on that integration.

**This week's exercise**
Each day, write briefly: (1) One way you used the discipline of desire this week. (2) One way you used the discipline of action. (3) One way you used the discipline of assent. (4) How they supported each other in one situation.`,
    'Daily: desire + action + assent + how they combined'
  ),

  // —— Week 47 ——
  week(
    47,
    'Practice the three disciplines together',
    'assent',
    `**Scenario**
We don't practice the three disciplines in isolation—in life they happen at once. This week we intentionally weave them together: desire, action, and assent in the same situation.

**Ancient text (Marcus Aurelius, Meditations 8.7)**  
"Let the part of you that forms judgments be undisturbed by what happens to the body or the soul."

**Explanation**
In any moment we can ask: What do I want or fear? (desire.) What should I do? (action.) What should I assent to? (assent.) Practicing all three in the same situation deepens our integration.

**This week's exercise**
Each day, pick one situation (past or coming). Write: (1) Desire: What did you want or fear? Was it in your control? (2) Action: What did you do or will you do? Was it for the common welfare? (3) Assent: What did you assent to? Was it accurate? One paragraph total is fine.`,
    'Daily: one situation + desire + action + assent'
  ),

  // —— Week 48 ——
  week(
    48,
    'Create your own Stoic curriculum',
    'assent',
    `**Scenario**
The 52 weeks have given you a structure. Now you can design your own: which exercises, which readings, which reminders serve you best? This week we reflect and plan a personal curriculum for the next phase.

**Ancient text (Epictetus, Enchiridion 29)**  
"Progress is achieved by confirming what we already know and adding to it."

**Explanation**
A personal curriculum isn't about inventing new philosophy—it's about choosing what to reinforce. You might repeat certain weeks, combine exercises, or focus on one discipline for a while. The goal is continued progress.

**This week's exercise**
Write (and revise as needed): (1) Which weeks or exercises have helped you most? (2) What do you want to strengthen next (desire, action, assent)? (3) A simple plan for the next month: one or two practices to do daily or weekly. Keep it realistic.`,
    'Plan: strengths + focus + next month'
  ),

  // —— Week 49 ——
  week(
    49,
    'Refine your practice',
    'assent',
    `**Scenario**
Practice can become routine. This week we refine: we look at where we're going through the motions and where we're truly engaging. We sharpen one or two habits so they stay alive.

**Ancient text (Seneca, Letters 94)**  
"We need to be taught not to be swayed by the wrong things, and to assign value only to what deserves it."

**Explanation**
Refinement means paying attention to quality, not just quantity. Are we really pausing before assent? Really acting with reserve? Really examining our desires? We identify one area to deepen.

**This week's exercise**
Each day, choose one practice to refine (e.g. nightly review, morning premeditation, pausing before assent). Do it with full attention. At night, write one sentence: What was different when you did it with care?`,
    'Daily: one practice refined + one sentence'
  ),

  // —— Week 50 ——
  week(
    50,
    'Deepen your understanding',
    'assent',
    `**Scenario**
Understanding supports practice. This week we deepen our grasp of one Stoic idea that matters to us—dichotomy of control, reserve, the three disciplines, or the view from above—by reading, reflecting, or discussing.

**Ancient text (Epictetus, Discourses 1.1)**  
"Philosophy does not promise to secure anything external for people; if it did, it would be admitting something beyond its subject matter."

**Explanation**
Stoicism is a practical philosophy. Deepening understanding means seeing how the ideas apply to real life—yours and others'. We might reread a passage, write an explanation in our own words, or connect it to a current challenge.

**This week's exercise**
Pick one Stoic concept. Each day, do one of: (1) Read a short passage about it. (2) Write it in your own words. (3) Apply it to one situation from your day. Rotate or repeat as you like.`,
    'Daily: one concept + read / write / apply'
  ),

  // —— Week 51 ——
  week(
    51,
    'Integrate Stoicism into daily life',
    'assent',
    `**Scenario**
The goal isn't to "do Stoicism" for an hour and forget it—it's to live with a Stoic orientation. This week we focus on integration: small cues, reminders, and habits that keep the three disciplines present in ordinary moments.

**Ancient text (Marcus Aurelius, Meditations 5.1)**  
"At dawn, when you have trouble getting out of bed, tell yourself: I am rising to do the work of a human being."

**Explanation**
Integration can mean morning or evening rituals, a phrase we repeat when stressed, or a single question we ask before reacting. We choose what fits our life and practice it until it becomes second nature.

**This week's exercise**
Choose one integration habit (e.g. a morning line, a pause before replying to messages, a nightly one-sentence review). Practice it every day. Write briefly what helped you remember it and what got in the way. Adjust as needed.`,
    'Daily: one integration habit + what helped or hindered'
  ),

  // —— Week 52 ——
  week(
    52,
    'Commit to a lifetime of practice',
    'assent',
    `**Scenario**
The 52 weeks are a beginning, not an end. The Stoics saw philosophy as a way of life—something we practice for a lifetime. This week we reflect on the journey and commit to continuing.

**Ancient text (Epictetus, Enchiridion 51)**  
"Until we have begun to put our teachings into practice, we are not making progress."

**Explanation**
Progress is ongoing. We'll forget, slip, and restart. Commitment doesn't mean perfection; it means returning again and again to the three disciplines—desire, action, and assent—and letting them shape how we live.

**This week's exercise**
Write a short letter to yourself (or a few paragraphs): (1) What has changed for you over these weeks? (2) What do you want to keep practicing? (3) One concrete commitment for the next year (e.g. nightly review, one key phrase at hand, or a monthly re-read of one week). Sign it and keep it. Then continue.`,
    'Letter: what changed + what to keep + one-year commitment'
  ),
];

export function getStoicWeek(weekNumber: number): StoicWeek | undefined {
  return STOIC_HANDBOOK.find((w) => w.week === weekNumber);
}

export function getStoicWeeksByPart(part: StoicPart): StoicWeek[] {
  return STOIC_HANDBOOK.filter((w) => w.part === part);
}
