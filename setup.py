from setuptools import setup

setup(name='eosjs_python',
      version='0.1.82',
      description='Python library to communicate with eosjs in order to sign blockchain transactions.',
      url='https://github.com/EvaCoop/eosjs_python',
      author='Raphael Gaudreault, Merouane Benthameur',
      author_email='raphael.gaudreault@eva.coop, merouane.benthameur@eva.coop',
      license='MIT',
      packages=['eosjs_python'],
      install_requires=['Naked'],
      include_package_data=True,
      zip_safe=False)
