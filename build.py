import os
r=lambda f:open(os.path.join('/tmp/site2',f)).read()
css=r('src/style.css')
js='\n'.join([r('shapes.js'),r('images.js'),r('src/core.js'),r('src/data.js'),r('src/widgets.js'),r('src/views.js'),r('src/play.js'),r('src/boot.js')])
open('/tmp/site2/all.js','w').write(js)
html=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>Lucky Charms</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400..700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<a class="skip" href="#">Skip to content</a>
<header class="bar" id="bar"></header>
<main id="view" tabindex="-1"></main>
<footer></footer>
<div id="overlay"></div>
<script>
{js}
</script>
</body>
</html>
'''
open('/tmp/site2/index.html','w').write(html); print(len(html)//1024,'KB')
