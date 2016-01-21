# mobile release

# Installation

    npm install
    npm install gulp typescript -g

# start

    gulp
    tns run ios --emulator

# Issues
- android build is not working as somewhere we have set up wrong buildToolsVersion, point to to soime 23.0.0_rc1
So have to rewrite it in: build.gradle @ 66
