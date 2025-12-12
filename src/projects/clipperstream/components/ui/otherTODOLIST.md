To-do list then we go to a new line so it's a list. 



In our to-do list, the next thing to sort of work on is how the scroll feature works when you add extra blocks to an existing clip. Right? And then also the second thing we which we also need to work on is a scroll feature wherever you have like a little button that basically shows how you can scroll down to the bottom and see all the text that's actually missing. So people always know that when they cross the viewport, there's extra text they haven't checked yet.

The second thing that we also haven't worked on is what happens when you go offline. You click to record and record a clip rather than there. That means the clip needs to be stored somewhere for later translation, so that means it's going to be saved and then sent for translation after you go back online. So that whole process hasn't been tested out. Storage space for recording clips is one, two, name method for recording clips that's two, and three. The process of sending the transcription online to let you get transcribed, and then what we would also need to do at this junction is sort of see what it's like when we have one that's waiting to transcribe when you go online. The switch is to transcribing, and then also what it looks like on the inside when it literally goes from the state of a recording container which is showing transcribing to the actual text which you would see that replaces it. It's meant to be automatic, so that's what we need to test next.


In my mind, one of the things I want to do is see the transition between an actual container, like an equivalent clip of Offline.tsx demo. Just like the way we do with interactive demos, we switch from an existing clip which is actively transcribing to a block of text. That's the next thing we need to try.






Okay, the next thing that we haven't done that we need to do is you need to do the animation in for the text, and that means we're going to be referencing AI Confidence Tracker. How the text comes in only that in this case it's going to be one huge blurb, so we're not going to do streaming. That's the first thing.

Secondly, we also need to mention the fact that you can actually interact with the text like you can choose to click and delete it. Like, let's say you can also click on the text and edit it? So you can just delete some part, type some part in it's like your personal scratch pad if you want to call it that. Now the thing is, right now at the moment, in the clipRecord screen, after you finished doing like a recording, what happens is basically it gets converted to text and then you have your copy button, as well as your structure button and record button. So the first thing that we haven't done yet is we haven't done the transition whereby, because right now I know that after the text gets transcribed, if for some reason you choose to delete that text inside your clip, right? The copy button shouldn't show anymore. Same thing with the structure button as well. So just like the way we've done the animation for the direct complete state in mainvarmorph, which is basically going to reverse that. So we would literally go from complete state to the initial state of direct complete state, such that those two buttons, the structure and copy button, would disappear. How we sort of done it for the closed to copy button in @clipmorphingbuttons.tsx . Okay, so that's exactly what we're going to do. And the same would also apply if for some reason you choose to type like one word. You have that copy button coming, you also have the structure button coming as well, like the reverse of that. Or, we can just choose to make the buttons sort of like in a dormant state, that way people know that they're not clickable. Rather than making buttons disappear and reappear all the time, I think that may be a bit more palatable in the sense that it's not as jarring to see the buttons vanish off the screen. So, that's what we'll go for instead.



Another thing which I forgot to mention that we also need to do is what happens when you click on the structure button and you want to reverse what has been done. So for example, for now, the very first demo I'm just going to have you click on the structure button and it will show you remove formatting and it will literally just remove the formatting right there and there happens instantly, not difficult. We can do like an opacity switch for that, like what we did for clip morphing buttons, like a close to copy button switch. Pretty simple, nothing too special. What's on my mind now is what happens when for example the text has been formatted but you want to format let's say for email right formatting for email which means we're going to send it to an AI. It's not changing the text but trying to put paragraphs and whatnot so it's a bit more decent. Or formatting for WhatsApp, or from promising for like messengers format for chat, or format for what time that's all in those features they'll need to go back to the AI. It'd be relatively fast, but what happens when you press the button are you just waiting for it to suddenly happen? There should be a state which shows what is actively being done, and obviously I think that there should be something visible. So we're probably thinking of basically making their record bar the place where this happened. The structure button would become sort of like you'd have the process and spinner inside the structure button in its own colour style, and then space where you have like the wavelength and like the timer that bit would literally just be saying something along the lines of like formatting for email and you'd have like the triple dot showing, or like email formatting or something like that. And we basically go from there.




Ok, the next thing we have to talk about is what happens when you click on a Waiting To Transcribe container. If you click on a Waiting To Transcribe container, you're going to be taken to ClipRecordScreen, right? From our ClipHomeScreen. So basically when you go in there, what you're going to see is a sample record that has not been transcribed yet. That's literally just waiting.

Also, I'm still looking at how I can tweak the recording that hasn't been transcribed yet, rather than you having to click on a triple dot to see the word transcribe as well as delete. You don't need to see the word transcribe because you can't actively force it to transcribe, it's automatic. So I'm going to change the way the syntax looks there, probably replace the triple bottom with a delete as well as a transcribe icon which will start rotating to actively show you a transcription is being done because you're in "back online". I just thought to also mention that as well!

The same applies to transcribing clips, so if a clip is already seen transcribing, you're on the home screen. If you're clicking to go in, you're not going to see anything special. You just see the fact that obviously the recording one or whatever it is has that transcribed bar that's literally rotating, so you know that transcription is currently on the way.

Another thing which we haven't done, which we also have to consider next would be for with regards to streaming. We're calling this streaming just for the mere sake of calling it streaming, but it's more like speech-to-text. Like, what happens when the conversion literally happens? How does that animate on the screen? So, like I said, we're going to reference some AI confidence tracker for that, but it's not going to be word-by-word. It's going to be the whole blurb at once being animated in. One thing to obviously mention is it's possible for you to literally get like a specific text translated right, and then for some reason you're suddenly offline. So we need to show what it's like to have your past partial text like translated. You try to do another recording, obviously it just comes at the bottom as recording, but you're seeing like an intersection or interaction between complete your transcription as well as a transcript transcription that's obviously pending. One thing I personally noticed is it's impossible to ever have a transcription that's pending and then have text which has been transcribed under it. You can only ever have text which has been transcribed, and then a pending transcription under it. Because obviously it makes perfect sense.



ENGINEER TECHNICAL
Also, the technical details with regards to how the app actually works will need to be discussed. We need to see what we're going to do in situations where for some reason you've pushed your audio for transcription and midway through, maybe in the process of actually uploading, you lose connection. Or maybe in the process of before the cloud, before the place where inference is running, the cloud can give you a reply, you lose connection. So we need to make sure that the connection is persistent. So even if you lose connection, it would still be translated. And also, we want to cover the idea that even if you've pushed something for translation, we still have the physical copy on phone on device. If for some reason you lose connection, we can always just put it there for automatic transcription when you come back in. Rather than a situation whereby you use your voice to talk and you're expecting transcription and for some reason, basically transcription gets lost because it's been pushed to the cloud or wherever it's been handled inference-wise and we don't have a spare copy. So we always keep the backup copy until you get the transcription back. Okay? And it's on the phone. So we need to think about the technical details of how that's going to be implemented as well.
______________________-

















--------NICE TO HAVE ------------
First off, the first one I haven't actually done on the to-do list is basically to fix the way the scroll works when you exit the search bar and you're not at the top of the list, so it just forcefully scrolls all the way to the top. I don't really like that animation; it's a bit jarring. The super fast nature of the scroll is one thing that needs to also be considered. I'm thinking we just do like a sort of opacity animation whereby when it goes back to the original, and the vn list is moving downwards because it's being pushed down by the existence of trans header main coming back in, we just need to do like an opacity change where opacity changes to the original. That way, it's less jarring when there's a switch again. You know, we'd have to go and check what best practises and what industry standards are. That's the first thing we have to look at. 

** NOT APPLICABLE STORED ON DEVICE
The second thing we have to look at is the number of elements you can have on the list before you then have to click on "load more." Should it be a case where you have to load more elements, or basically you just keep scrolling and when you get to the bottom of the list, you just pull up again? And then you can suddenly see more items. That's why I'm sort of actually thinking whether at the bottom of the list you have "load more" or literally just basically pull up and then automatically just tries to load again and show you more items when you've gotten to the bottom of the list. That's another thing we have to think of with Ergaster because the list can just be infinitely long, like super long. So that's one thing we also have to consider. Obviously, this would not affect this is like number two obviously and this is very different from when you're like certain this is more like when you're just going through your list of like recordings you've already made.
**

----NICE TO HAVE------
Another thing I also want to do is currently VN_LIST happens to be one of the components which actually currently exists inside @ClipHomeScreen.tsx , I need it as a separate component on its own so we can make use of its scroll related feature and throw that into other instances because we're going to have other places that would need to have scroll. That ability to scroll I think is quite interesting and it's something we want to move forward with. Obviously, if we're going to use it in other places, I'll say that we need to remove the pattern that we put at the top because in a default state that pattern will not be necessary. This is just one instance we've implemented it in and that's for @ClipHomeScreen.tsx    where the pattern is necessary. So we need to just have that as a basic element and basically, we also need to just have that inside @clipcomponents.tsx    I don't know if we're going to give it a separate file and just call it like vnlist or sorry like clip. We can't call it clip list because I think we already have something else that is called our clip list. We can just basically call it like clip vnscroll or something like that would be the simple way to basically just put it.





