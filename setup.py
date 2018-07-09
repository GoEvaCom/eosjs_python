from setuptools import setup

setup(name='eosjs_python',
      version='0.1.41',
      description='Python library to communicate with eosjs in order to sign blockchain transactions.',
      url='https://github.com/raphaelgodro/eosjs_python',
      author='Raphael Gaudreault',
      author_email='raphael.gaudreault@eva.coop',
      license='MIT',
      packages=['eosjs_python'],
      install_requires=[
      	'Naked'
      ],
      include_package_data=True,
      zip_safe=False)
